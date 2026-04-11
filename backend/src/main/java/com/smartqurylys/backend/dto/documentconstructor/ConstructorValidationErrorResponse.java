package com.smartqurylys.backend.dto.documentconstructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConstructorValidationErrorResponse {
    private String fieldKey;
    private String message;
}
