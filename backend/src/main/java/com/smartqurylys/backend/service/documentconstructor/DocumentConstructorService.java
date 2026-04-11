package com.smartqurylys.backend.service.documentconstructor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.smartqurylys.backend.dto.documentconstructor.*;
import com.smartqurylys.backend.entity.DocumentConstructorDocument;
import com.smartqurylys.backend.entity.DocumentConstructorTemplate;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.UserRepository;
import com.smartqurylys.backend.repository.documentconstructor.DocumentConstructorDocumentRepository;
import com.smartqurylys.backend.shared.enums.documentconstructor.ConstructorDocumentStatus;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.text.DecimalFormat;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class DocumentConstructorService {
    private static final Logger log = LoggerFactory.getLogger(DocumentConstructorService.class);
    private static final Pattern TOKEN_PATTERN = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_.-]+)\\s*}}");
    private static final TypeReference<List<Map<String, Object>>> LIST_OF_MAPS = new TypeReference<>() {};
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<ConstructorValidationErrorResponse>> ERRORS_TYPE = new TypeReference<>() {};

    private final DocumentConstructorDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final EntityManager entityManager;

    public List<ConstructorTemplateSummaryResponse> getTemplates() {
        return jdbcTemplate.query("""
                        select id, code, name, category, description, version
                        from document_constructor_templates
                        where is_active = true
                        order by category asc, name asc
                        """,
                (rs, rowNum) -> ConstructorTemplateSummaryResponse.builder()
                        .id(rs.getLong("id"))
                        .code(rs.getString("code"))
                        .name(rs.getString("name"))
                        .category(rs.getString("category"))
                        .description(rs.getString("description"))
                        .version(rs.getInt("version"))
                        .build())
                .stream()
                .toList();
    }

    public ConstructorTemplateDetailsResponse getTemplate(Long templateId) {
        return jdbcTemplate.query("""
                        select id, code, name, category, description, version, schema_json, layout_json
                        from document_constructor_templates
                        where id = ? and is_active = true
                        """,
                rs -> {
                    if (!rs.next()) {
                        throw new IllegalArgumentException("Template not found");
                    }
                    return ConstructorTemplateDetailsResponse.builder()
                            .id(rs.getLong("id"))
                            .code(rs.getString("code"))
                            .name(rs.getString("name"))
                            .category(rs.getString("category"))
                            .description(rs.getString("description"))
                            .version(rs.getInt("version"))
                            .sections(readJsonList(rs.getString("schema_json")))
                            .layout(readJsonList(rs.getString("layout_json")))
                            .build();
                }, templateId);
    }

    @Transactional(readOnly = true)
    public List<ConstructorDocumentResponse> getDocuments() {
        User currentUser = getAuthenticatedUser();
        log.info("Document constructor getDocuments for userId={}, email={}, role={}",
                currentUser.getId(), currentUser.getEmail(), currentUser.getRole());

        List<DocumentConstructorDocument> documents = "ADMIN".equals(currentUser.getRole())
                ? documentRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"))
                : documentRepository.findByOwnerUserIdOrderByUpdatedAtDesc(currentUser.getId());

        log.info("Document constructor repository returned {} document entities", documents.size());

        List<ConstructorDocumentResponse> results = new ArrayList<>();
        for (DocumentConstructorDocument document : documents) {
            try {
                Long ownerUserId = null;
                try {
                    ownerUserId = document.getOwnerUser() != null ? document.getOwnerUser().getId() : null;
                } catch (Exception ownerException) {
                    log.warn("Document constructor could not resolve owner for documentId={}: {}",
                            document.getId(), ownerException.getMessage());
                }

                log.info("Document constructor mapping documentId={}, templateId={}, ownerUserId={}, title={}",
                        document.getId(),
                        document.getTemplate() != null ? document.getTemplate().getId() : null,
                        ownerUserId,
                        document.getTitle());
                results.add(mapDocumentResponse(document, document.getTemplate().getCode()));
            } catch (Exception exception) {
                log.error("Document constructor failed to map documentId={}: {}",
                        document.getId(), exception.getMessage(), exception);
            }
        }
        log.info("Document constructor returning {} mapped documents", results.size());
        return results;
    }

    @Transactional(readOnly = true)
    public ConstructorDocumentResponse getDocument(Long documentId) {
        User currentUser = getAuthenticatedUser();
        DocumentConstructorDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        boolean isOwner = Objects.equals(document.getOwnerUser().getId(), currentUser.getId());
        boolean isAdmin = "ADMIN".equals(currentUser.getRole());
        if (!isOwner && !isAdmin) {
            throw new IllegalArgumentException("You do not have access to this document");
        }

        try {
            return mapDocumentResponse(document, document.getTemplate().getCode());
        } catch (Exception exception) {
            throw new IllegalArgumentException("Document not found");
        }
    }

    public ConstructorValidationResponse validate(ConstructorValidateRequest request) {
        TemplateMeta template = getTemplateMeta(request.getTemplateId());
        ValidationContext context = buildValidationContext(template, request.getFormData());

        return ConstructorValidationResponse.builder()
                .valid(context.errors.isEmpty())
                .renderedHtml(renderTemplate(template, request.getFormData(), context.fieldDefinitions))
                .errors(context.errors)
                .build();
    }

    @Transactional
    public ConstructorDocumentResponse createDocument(ConstructorDocumentSaveRequest request) {
        User currentUser = getAuthenticatedUser();
        return persistDocument(new DocumentConstructorDocument(), request.getTemplateId(), currentUser, request);
    }

    @Transactional
    public ConstructorDocumentResponse updateDocument(Long documentId, ConstructorDocumentSaveRequest request) {
        DocumentOwnershipMeta existing = getOwnedDocumentMeta(documentId);
        if (!existing.templateId().equals(request.getTemplateId())) {
            throw new IllegalArgumentException("Template cannot be changed for an existing draft");
        }
        DocumentConstructorDocument entity = entityManager.getReference(DocumentConstructorDocument.class, documentId);
        return persistDocument(entity, request.getTemplateId(), getAuthenticatedUser(), request);
    }

    @Transactional
    public ConstructorDocumentResponse duplicateDocument(Long documentId) {
        DocumentOwnershipMeta existing = getOwnedDocumentMeta(documentId);
        Instant now = Instant.now();

        DocumentConstructorDocument duplicate = DocumentConstructorDocument.builder()
                .template(entityManager.getReference(DocumentConstructorTemplate.class, existing.templateId()))
                .ownerUser(entityManager.getReference(User.class, existing.ownerUserId()))
                .title(existing.title() + " (Копия)")
                .status(ConstructorDocumentStatus.DRAFT)
                .templateNameSnapshot(existing.templateNameSnapshot())
                .templateVersionSnapshot(existing.templateVersionSnapshot())
                .formDataJson(existing.formDataJson())
                .renderedHtml(existing.renderedHtml())
                .validationErrorsJson(existing.validationErrorsJson())
                .createdAt(now)
                .updatedAt(now)
                .build();

        DocumentConstructorDocument saved = documentRepository.save(duplicate);
        return mapDocumentResponse(saved, saved.getTemplate().getCode());
    }

    private ConstructorDocumentResponse persistDocument(
            DocumentConstructorDocument document,
            Long templateId,
            User owner,
            ConstructorDocumentSaveRequest request
    ) {
        TemplateMeta template = getTemplateMeta(templateId);
        ValidationContext context = buildValidationContext(template, request.getFormData());
        Instant now = Instant.now();

        document.setTemplate(entityManager.getReference(DocumentConstructorTemplate.class, template.id()));
        document.setOwnerUser(entityManager.getReference(User.class, owner.getId()));
        document.setTitle(request.getTitle().trim());
        document.setTemplateNameSnapshot(template.name());
        document.setTemplateVersionSnapshot(template.version());
        document.setStatus(context.errors.isEmpty() ? ConstructorDocumentStatus.VALIDATED : ConstructorDocumentStatus.DRAFT);
        document.setFormDataJson(writeJson(request.getFormData()));
        document.setRenderedHtml(renderTemplate(template, request.getFormData(), context.fieldDefinitions));
        document.setValidationErrorsJson(writeJson(context.errors));
        if (document.getCreatedAt() == null) {
            document.setCreatedAt(now);
        }
        document.setUpdatedAt(now);

        DocumentConstructorDocument saved = documentRepository.save(document);
        return mapDocumentResponse(saved, template.code());
    }

    private ConstructorDocumentResponse mapDocumentResponse(
            DocumentConstructorDocument document,
            String templateCode
    ) {
        return ConstructorDocumentResponse.builder()
                .id(document.getId())
                .templateId(document.getTemplate().getId())
                .templateCode(templateCode)
                .templateName(document.getTemplateNameSnapshot())
                .templateVersion(document.getTemplateVersionSnapshot())
                .title(document.getTitle())
                .status(document.getStatus())
                .formData(safeReadJsonMap(document.getFormDataJson()))
                .renderedHtml(Optional.ofNullable(document.getRenderedHtml()).orElse(""))
                .validationErrors(safeReadValidationErrors(document.getValidationErrorsJson()))
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    public byte[] generatePdf(ConstructorPdfRequest request) {
        TemplateMeta template = getTemplateMeta(request.getTemplateId());
        ValidationContext context = buildValidationContext(template, request.getFormData());
        if (!context.errors.isEmpty()) {
            throw new IllegalArgumentException("Document contains validation errors and cannot be exported to PDF");
        }

        String renderedHtml = renderTemplate(template, request.getFormData(), context.fieldDefinitions);
        String documentHtml = buildPdfDocumentHtml(request.getTitle().trim(), renderedHtml);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(documentHtml, null);
            registerPdfFonts(builder);
            builder.toStream(outputStream);
            builder.run();
            return outputStream.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to generate PDF", exception);
        }
    }

    public String buildPdfFilename(String title) {
        String baseName = title == null ? "" : title.trim();
        if (baseName.isBlank()) {
            baseName = "document";
        }

        String sanitized = baseName
                .replaceAll("[\\\\/:*?\"<>|]+", "-")
                .replaceAll("\\s+", " ")
                .trim();

        if (sanitized.isBlank()) {
            sanitized = "document";
        }

        return sanitized + ".pdf";
    }

    private ValidationContext buildValidationContext(TemplateMeta template, Map<String, Object> formData) {
        Map<String, Object> safeFormData = formData != null ? formData : Collections.emptyMap();
        List<Map<String, Object>> sections = readJsonList(template.schemaJson());
        Map<String, Map<String, Object>> fieldDefinitions = flattenFieldDefinitions(sections);
        List<ConstructorValidationErrorResponse> errors = new ArrayList<>();

        for (Map<String, Object> field : fieldDefinitions.values()) {
            String key = asString(field.get("key"));
            if (key == null || !isVisible(field, safeFormData)) {
                continue;
            }

            Object rawValue = safeFormData.get(key);
            boolean required = Boolean.TRUE.equals(field.get("required"));
            String type = asString(field.get("type"));

            if (required && isBlankValue(rawValue, type)) {
                errors.add(validationError(key, asString(field.get("label")) + " is required"));
                continue;
            }

            if (rawValue == null || isBlankValue(rawValue, type)) {
                continue;
            }

            if ("money".equals(type) && parseBigDecimal(rawValue) == null) {
                errors.add(validationError(key, asString(field.get("label")) + " must be a valid amount"));
            }

            if ("date".equals(type) && !isValidDate(rawValue)) {
                errors.add(validationError(key, asString(field.get("label")) + " must be a valid date"));
            }

            if ("select".equals(type)) {
                List<Map<String, Object>> options = getMapList(field.get("options"));
                if (!options.isEmpty()) {
                    Set<String> allowedValues = new HashSet<>();
                    for (Map<String, Object> option : options) {
                        String value = asString(option.get("value"));
                        if (value != null) {
                            allowedValues.add(value);
                        }
                    }
                    if (!allowedValues.contains(String.valueOf(rawValue))) {
                        errors.add(validationError(key, asString(field.get("label")) + " has an unsupported value"));
                    }
                }
            }

            Map<String, Object> validation = getMap(field.get("validation"));
            if (!validation.isEmpty()) {
                applyValidationRules(errors, key, rawValue, type, field, validation);
            }
        }

        return new ValidationContext(fieldDefinitions, errors);
    }

    private String renderTemplate(
            TemplateMeta template,
            Map<String, Object> formData,
            Map<String, Map<String, Object>> fieldDefinitions
    ) {
        StringBuilder html = new StringBuilder();
        html.append("<article class=\"dc-document\">");
        html.append("<header class=\"dc-document__header\">");
        html.append("<p class=\"dc-document__eyebrow\">Template-first business document</p>");
        html.append("<h1>").append(escapeHtml(template.name())).append("</h1>");
        html.append("</header>");

        for (Map<String, Object> section : readJsonList(template.layoutJson())) {
            if (!isVisible(section, formData)) {
                continue;
            }
            String sectionTitle = asString(section.get("title"));
            html.append("<section class=\"dc-document__section\">");
            if (sectionTitle != null && !sectionTitle.isBlank()) {
                html.append("<h2>").append(escapeHtml(sectionTitle)).append("</h2>");
            }
            for (Map<String, Object> block : getMapList(section.get("blocks"))) {
                if (!isVisible(block, formData)) {
                    continue;
                }
                renderBlock(html, block, formData, fieldDefinitions);
            }
            html.append("</section>");
        }

        html.append("</article>");
        return html.toString();
    }

    private String buildPdfDocumentHtml(String title, String renderedHtml) {
        return """
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                  <meta charset="UTF-8" />
                  <style>
                    @page {
                      size: A4;
                      margin: 18mm 16mm 18mm 16mm;
                    }
                    body {
                      margin: 0;
                      font-family: 'Arial', sans-serif;
                      color: #1f2937;
                      font-size: 12pt;
                    }
                    .pdf-shell {
                      width: 100%%;
                    }
                    .dc-document__header {
                      margin-bottom: 18px;
                    }
                    .dc-document__header h1 {
                      margin: 0 0 8px 0;
                      font-size: 22pt;
                      color: #14213d;
                    }
                    .dc-document__eyebrow {
                      margin: 0 0 8px 0;
                      font-size: 8.5pt;
                      letter-spacing: 0.14em;
                      text-transform: uppercase;
                      color: #8d6e63;
                    }
                    .dc-document__section {
                      margin-top: 18px;
                    }
                    .dc-document__section h2 {
                      margin: 0 0 10px 0;
                      font-size: 15pt;
                      color: #14213d;
                    }
                    .dc-document__section h3 {
                      margin: 0 0 8px 0;
                      font-size: 13pt;
                      color: #14213d;
                    }
                    .dc-document__section p,
                    .dc-document__section li {
                      margin: 0 0 10px 0;
                      line-height: 1.55;
                    }
                    .dc-document__section ul {
                      margin: 0 0 12px 18px;
                      padding: 0;
                    }
                    .dc-editable {
                      background: #fdf1e8;
                      border-radius: 3px;
                      padding: 0 2px;
                    }
                    .dc-editable.is-empty {
                      color: #991b1b;
                      background: #fde8e8;
                    }
                  </style>
                  <title>%s</title>
                </head>
                <body>
                  <div class="pdf-shell">%s</div>
                </body>
                </html>
                """.formatted(escapeHtml(title), renderedHtml);
    }

    private void registerPdfFonts(PdfRendererBuilder builder) {
        for (String fontPath : getPdfFontCandidates()) {
            try {
                Path path = Path.of(fontPath);
                if (!Files.exists(path)) {
                    continue;
                }
                builder.useFont(path.toFile(), "Arial");
                log.info("Document constructor registered PDF font from {}", fontPath);
                return;
            } catch (Exception exception) {
                log.warn("Document constructor failed to register PDF font {}: {}", fontPath, exception.getMessage());
            }
        }

        log.warn("Document constructor did not find a dedicated PDF font with Cyrillic support. Generated PDF may have limited glyph support.");
    }

    private List<String> getPdfFontCandidates() {
        return List.of(
                "C:\\\\Windows\\\\Fonts\\\\arial.ttf",
                "C:\\\\Windows\\\\Fonts\\\\ARIAL.TTF",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/usr/share/fonts/dejavu/DejaVuSans.ttf"
        );
    }

    private void renderBlock(
            StringBuilder html,
            Map<String, Object> block,
            Map<String, Object> formData,
            Map<String, Map<String, Object>> fieldDefinitions
    ) {
        String type = Optional.ofNullable(asString(block.get("type"))).orElse("paragraph");
        switch (type) {
            case "heading" -> html.append("<h1>").append(renderText(asString(block.get("content")), formData, fieldDefinitions)).append("</h1>");
            case "subheading" -> html.append("<h3>").append(renderText(asString(block.get("content")), formData, fieldDefinitions)).append("</h3>");
            case "list" -> {
                html.append("<ul>");
                for (Object item : getObjectList(block.get("items"))) {
                    html.append("<li>").append(renderText(String.valueOf(item), formData, fieldDefinitions)).append("</li>");
                }
                html.append("</ul>");
            }
            default -> html.append("<p>").append(renderText(asString(block.get("content")), formData, fieldDefinitions)).append("</p>");
        }
    }

    private String renderText(
            String templateText,
            Map<String, Object> formData,
            Map<String, Map<String, Object>> fieldDefinitions
    ) {
        if (templateText == null) {
            return "";
        }

        Matcher matcher = TOKEN_PATTERN.matcher(templateText);
        StringBuilder rendered = new StringBuilder();
        int lastIndex = 0;

        while (matcher.find()) {
            rendered.append(escapeHtml(templateText.substring(lastIndex, matcher.start())));
            String fieldKey = matcher.group(1);
            Map<String, Object> fieldDefinition = fieldDefinitions.get(fieldKey);
            Object value = formData != null ? formData.get(fieldKey) : null;
            String displayValue = formatValue(value, fieldDefinition);
            boolean empty = displayValue == null || displayValue.isBlank();
            String fallback = fieldDefinition != null ? asString(fieldDefinition.get("label")) : fieldKey;

            rendered.append("<span class=\"dc-editable");
            if (empty) {
                rendered.append(" is-empty");
            }
            rendered.append("\" data-field=\"").append(escapeHtml(fieldKey)).append("\">");
            rendered.append(escapeHtml(empty ? "[" + fallback + "]" : displayValue));
            rendered.append("</span>");
            lastIndex = matcher.end();
        }

        rendered.append(escapeHtml(templateText.substring(lastIndex)));
        return rendered.toString();
    }

    private String formatValue(Object rawValue, Map<String, Object> fieldDefinition) {
        if (rawValue == null) {
            return "";
        }

        String type = fieldDefinition != null ? asString(fieldDefinition.get("type")) : null;

        if ("money".equals(type)) {
            BigDecimal amount = parseBigDecimal(rawValue);
            if (amount == null) {
                return String.valueOf(rawValue);
            }
            DecimalFormat format = new DecimalFormat("#,##0.00");
            format.setGroupingUsed(true);
            return format.format(amount) + " KZT";
        }

        if ("date".equals(type)) {
            try {
                return LocalDate.parse(String.valueOf(rawValue)).toString();
            } catch (DateTimeParseException ignored) {
                return String.valueOf(rawValue);
            }
        }

        if ("boolean".equals(type)) {
            return Boolean.TRUE.equals(rawValue) ? "Yes" : "No";
        }

        return String.valueOf(rawValue);
    }

    private Map<String, Map<String, Object>> flattenFieldDefinitions(List<Map<String, Object>> sections) {
        Map<String, Map<String, Object>> fieldDefinitions = new LinkedHashMap<>();
        for (Map<String, Object> section : sections) {
            for (Map<String, Object> field : getMapList(section.get("fields"))) {
                String key = asString(field.get("key"));
                if (key != null) {
                    fieldDefinitions.put(key, field);
                }
            }
        }
        return fieldDefinitions;
    }

    private boolean isVisible(Map<String, Object> config, Map<String, Object> formData) {
        String visibleWhen = asString(config.get("visibleWhen"));
        if (visibleWhen == null || visibleWhen.isBlank()) {
            return true;
        }
        boolean inverted = visibleWhen.startsWith("!");
        String key = inverted ? visibleWhen.substring(1) : visibleWhen;
        Object value = formData != null ? formData.get(key) : null;
        boolean truthy = Boolean.TRUE.equals(value) || "true".equalsIgnoreCase(String.valueOf(value));
        return inverted ? !truthy : truthy;
    }

    private boolean isBlankValue(Object value, String type) {
        if (value == null) {
            return true;
        }
        if ("boolean".equals(type)) {
            return false;
        }
        return String.valueOf(value).trim().isEmpty();
    }

    private boolean isValidDate(Object rawValue) {
        try {
            LocalDate.parse(String.valueOf(rawValue));
            return true;
        } catch (DateTimeParseException exception) {
            return false;
        }
    }

    private BigDecimal parseBigDecimal(Object rawValue) {
        try {
            return new BigDecimal(String.valueOf(rawValue).replace(",", "").trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private ConstructorValidationErrorResponse validationError(String fieldKey, String message) {
        return ConstructorValidationErrorResponse.builder()
                .fieldKey(fieldKey)
                .message(message)
                .build();
    }

    private DocumentOwnershipMeta getOwnedDocumentMeta(Long documentId) {
        User currentUser = getAuthenticatedUser();
        return jdbcTemplate.query("""
                        select d.id,
                               d.template_id,
                               d.owner_user_id,
                               d.title,
                               d.template_name_snapshot,
                               d.template_version_snapshot,
                               d.form_data_json,
                               d.rendered_html,
                               d.validation_errors_json
                        from document_constructor_documents d
                        where d.id = ?
                        """,
                rs -> {
                    if (!rs.next()) {
                        throw new IllegalArgumentException("Document not found");
                    }
                    Long ownerUserId = rs.getLong("owner_user_id");
                    boolean isOwner = ownerUserId.equals(currentUser.getId());
                    boolean isAdmin = "ADMIN".equals(currentUser.getRole());
                    if (!isOwner && !isAdmin) {
                        throw new IllegalArgumentException("You do not have access to this document");
                    }
                    return new DocumentOwnershipMeta(
                            rs.getLong("id"),
                            rs.getLong("template_id"),
                            ownerUserId,
                            rs.getString("title"),
                            rs.getString("template_name_snapshot"),
                            rs.getInt("template_version_snapshot"),
                            rs.getString("form_data_json"),
                            rs.getString("rendered_html"),
                            rs.getString("validation_errors_json")
                    );
                }, documentId);
    }

    private TemplateMeta getTemplateMeta(Long templateId) {
        return jdbcTemplate.query("""
                        select id, code, name, category, description, version, schema_json, layout_json
                        from document_constructor_templates
                        where id = ? and is_active = true
                        """,
                rs -> {
                    if (!rs.next()) {
                        throw new IllegalArgumentException("Template not found");
                    }
                    return new TemplateMeta(
                            rs.getLong("id"),
                            rs.getString("code"),
                            rs.getString("name"),
                            rs.getString("category"),
                            rs.getString("description"),
                            rs.getInt("version"),
                            rs.getString("schema_json"),
                            rs.getString("layout_json")
                    );
                }, templateId);
    }

    private List<ConstructorDocumentResponse> findDocuments(User currentUser, Long documentId) {
        boolean isAdmin = "ADMIN".equals(currentUser.getRole());
        String sql = """
                select d.id,
                       d.template_id,
                       t.code as template_code,
                       d.template_name_snapshot,
                       d.template_version_snapshot,
                       d.title,
                       d.status,
                       d.form_data_json,
                       d.rendered_html,
                       d.validation_errors_json,
                       d.created_at,
                       d.updated_at
                from document_constructor_documents d
                join document_constructor_templates t on t.id = d.template_id
                where (? is null or d.id = ?)
                  and (? = true or d.owner_user_id = ?)
                order by d.updated_at desc
                """;
        return jdbcTemplate.query(sql, rs -> {
                    List<ConstructorDocumentResponse> results = new ArrayList<>();
                    while (rs.next()) {
                        try {
                            results.add(ConstructorDocumentResponse.builder()
                                    .id(rs.getLong("id"))
                                    .templateId(rs.getLong("template_id"))
                                    .templateCode(rs.getString("template_code"))
                                    .templateName(rs.getString("template_name_snapshot"))
                                    .templateVersion(rs.getInt("template_version_snapshot"))
                                    .title(rs.getString("title"))
                                    .status(parseStatus(rs.getString("status")))
                                    .formData(readJsonMap(rs.getString("form_data_json")))
                                    .renderedHtml(Optional.ofNullable(rs.getString("rendered_html")).orElse(""))
                                    .validationErrors(readValidationErrors(rs.getString("validation_errors_json")))
                                    .createdAt(toInstant(rs.getTimestamp("created_at")))
                                    .updatedAt(toInstant(rs.getTimestamp("updated_at")))
                                    .build());
                        } catch (Exception exception) {
                            // Skip malformed legacy rows so one bad draft does not break the whole constructor page.
                        }
                    }
                    return results;
                },
                documentId, documentId, isAdmin, currentUser.getId());
    }

    private User getAuthenticatedUser() {
        String email = getAuthenticatedEmail();
        log.info("Document constructor resolved authenticated email={}", email);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private String getAuthenticatedEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        return String.valueOf(principal);
    }

    private List<Map<String, Object>> readJsonList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, LIST_OF_MAPS);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to parse stored JSON list", exception);
        }
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, MAP_TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to parse stored JSON map", exception);
        }
    }

    private List<ConstructorValidationErrorResponse> readValidationErrors(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, ERRORS_TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to parse stored validation errors", exception);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize JSON payload", exception);
        }
    }

    private String asString(Object value) {
        return value != null ? String.valueOf(value) : null;
    }

    private List<Map<String, Object>> getMapList(Object rawValue) {
        if (!(rawValue instanceof List<?> rawList)) {
            return Collections.emptyList();
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : rawList) {
            if (item instanceof Map<?, ?> rawMap) {
                Map<String, Object> typedMap = new LinkedHashMap<>();
                for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
                    typedMap.put(String.valueOf(entry.getKey()), entry.getValue());
                }
                result.add(typedMap);
            }
        }
        return result;
    }

    private Map<String, Object> getMap(Object rawValue) {
        if (!(rawValue instanceof Map<?, ?> rawMap)) {
            return Collections.emptyMap();
        }
        Map<String, Object> typedMap = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
            typedMap.put(String.valueOf(entry.getKey()), entry.getValue());
        }
        return typedMap;
    }

    private List<Object> getObjectList(Object rawValue) {
        if (rawValue instanceof List<?> rawList) {
            return new ArrayList<>(rawList);
        }
        return Collections.emptyList();
    }

    private void applyValidationRules(
            List<ConstructorValidationErrorResponse> errors,
            String key,
            Object rawValue,
            String type,
            Map<String, Object> field,
            Map<String, Object> validation
    ) {
        String label = asString(field.get("label"));
        String value = String.valueOf(rawValue).trim();

        Integer minLength = asInteger(validation.get("minLength"));
        Integer maxLength = asInteger(validation.get("maxLength"));
        Double minValue = asDouble(validation.get("minValue"));
        Double maxValue = asDouble(validation.get("maxValue"));
        String pattern = asString(validation.get("pattern"));
        String patternMessage = asString(validation.get("patternMessage"));

        if (minLength != null && value.length() < minLength) {
            errors.add(validationError(key, label + " must contain at least " + minLength + " characters"));
        }

        if (maxLength != null && value.length() > maxLength) {
            errors.add(validationError(key, label + " must contain no more than " + maxLength + " characters"));
        }

        if ("money".equals(type)) {
            BigDecimal amount = parseBigDecimal(rawValue);
            if (amount != null) {
                if (minValue != null && amount.compareTo(BigDecimal.valueOf(minValue)) < 0) {
                    errors.add(validationError(key, label + " must be at least " + formatPlainNumber(minValue)));
                }
                if (maxValue != null && amount.compareTo(BigDecimal.valueOf(maxValue)) > 0) {
                    errors.add(validationError(key, label + " must be no more than " + formatPlainNumber(maxValue)));
                }
            }
        }

        if (pattern != null && !pattern.isBlank() && !value.matches(pattern)) {
            errors.add(validationError(key, patternMessage != null && !patternMessage.isBlank()
                    ? patternMessage
                    : label + " has an invalid format"));
        }
    }

    private Integer asInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String formatPlainNumber(Double value) {
        if (value == null) {
            return "";
        }
        if (Math.floor(value) == value) {
            return Long.toString(value.longValue());
        }
        return Double.toString(value);
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private record ValidationContext(
            Map<String, Map<String, Object>> fieldDefinitions,
            List<ConstructorValidationErrorResponse> errors
    ) {
    }

    private ConstructorDocumentStatus parseStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return ConstructorDocumentStatus.DRAFT;
        }
        return ConstructorDocumentStatus.valueOf(rawStatus);
    }

    private Instant toInstant(java.sql.Timestamp timestamp) {
        return timestamp != null ? timestamp.toInstant() : Instant.now();
    }

    private Map<String, Object> safeReadJsonMap(String json) {
        try {
            return readJsonMap(json);
        } catch (Exception exception) {
            log.warn("Document constructor could not parse form_data_json, using empty map instead: {}", exception.getMessage());
            return Collections.emptyMap();
        }
    }

    private List<ConstructorValidationErrorResponse> safeReadValidationErrors(String json) {
        try {
            return readValidationErrors(json);
        } catch (Exception exception) {
            log.warn("Document constructor could not parse validation_errors_json, using empty list instead: {}", exception.getMessage());
            return Collections.emptyList();
        }
    }

    private record TemplateMeta(
            Long id,
            String code,
            String name,
            String category,
            String description,
            Integer version,
            String schemaJson,
            String layoutJson
    ) {
    }

    private record DocumentOwnershipMeta(
            Long id,
            Long templateId,
            Long ownerUserId,
            String title,
            String templateNameSnapshot,
            Integer templateVersionSnapshot,
            String formDataJson,
            String renderedHtml,
            String validationErrorsJson
    ) {
    }
}
