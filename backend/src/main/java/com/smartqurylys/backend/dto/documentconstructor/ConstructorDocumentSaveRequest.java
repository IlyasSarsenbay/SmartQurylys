package com.smartqurylys.backend.dto.documentconstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConstructorDocumentSaveRequest {
    @NotNull
    private Long templateId;

    @NotBlank
    private String title;

    @NotNull
    private Map<String, Object> formData;
}
