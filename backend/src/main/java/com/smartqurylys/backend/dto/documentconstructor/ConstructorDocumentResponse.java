package com.smartqurylys.backend.dto.documentconstructor;

import com.smartqurylys.backend.shared.enums.documentconstructor.ConstructorDocumentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConstructorDocumentResponse {
    private Long id;
    private Long templateId;
    private String templateCode;
    private String templateName;
    private Integer templateVersion;
    private String title;
    private ConstructorDocumentStatus status;
    private Map<String, Object> formData;
    private String renderedHtml;
    private List<ConstructorValidationErrorResponse> validationErrors;
    private Instant createdAt;
    private Instant updatedAt;
}
