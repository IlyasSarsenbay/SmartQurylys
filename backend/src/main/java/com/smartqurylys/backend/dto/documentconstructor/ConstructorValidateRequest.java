package com.smartqurylys.backend.dto.documentconstructor;

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
public class ConstructorValidateRequest {
    @NotNull
    private Long templateId;

    @NotNull
    private Map<String, Object> formData;
}
