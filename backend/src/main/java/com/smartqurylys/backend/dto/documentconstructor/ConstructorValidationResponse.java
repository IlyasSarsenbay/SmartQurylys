package com.smartqurylys.backend.dto.documentconstructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConstructorValidationResponse {
    private boolean valid;
    private String renderedHtml;
    private List<ConstructorValidationErrorResponse> errors;
}
