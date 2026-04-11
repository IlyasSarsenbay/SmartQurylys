package com.smartqurylys.backend.dto.documentconstructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConstructorTemplateSummaryResponse {
    private Long id;
    private String code;
    private String name;
    private String category;
    private String description;
    private Integer version;
}
