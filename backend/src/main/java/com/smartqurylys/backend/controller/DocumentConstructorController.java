package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.documentconstructor.*;
import com.smartqurylys.backend.service.documentconstructor.DocumentConstructorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/document-constructor")
@RequiredArgsConstructor
public class DocumentConstructorController {

    private final DocumentConstructorService documentConstructorService;

    @GetMapping("/templates")
    public List<ConstructorTemplateSummaryResponse> getTemplates() {
        return documentConstructorService.getTemplates();
    }

    @GetMapping("/templates/{templateId}")
    public ConstructorTemplateDetailsResponse getTemplate(@PathVariable Long templateId) {
        return documentConstructorService.getTemplate(templateId);
    }

    @GetMapping("/documents")
    public List<ConstructorDocumentResponse> getDocuments() {
        return documentConstructorService.getDocuments();
    }

    @GetMapping("/documents/{documentId}")
    public ConstructorDocumentResponse getDocument(@PathVariable Long documentId) {
        return documentConstructorService.getDocument(documentId);
    }

    @PostMapping("/documents")
    public ConstructorDocumentResponse createDocument(@Valid @RequestBody ConstructorDocumentSaveRequest request) {
        return documentConstructorService.createDocument(request);
    }

    @PutMapping("/documents/{documentId}")
    public ConstructorDocumentResponse updateDocument(
            @PathVariable Long documentId,
            @Valid @RequestBody ConstructorDocumentSaveRequest request
    ) {
        return documentConstructorService.updateDocument(documentId, request);
    }

    @PostMapping("/documents/{documentId}/duplicate")
    public ConstructorDocumentResponse duplicateDocument(@PathVariable Long documentId) {
        return documentConstructorService.duplicateDocument(documentId);
    }

    @PostMapping("/validate")
    public ConstructorValidationResponse validate(@Valid @RequestBody ConstructorValidateRequest request) {
        return documentConstructorService.validate(request);
    }
}
