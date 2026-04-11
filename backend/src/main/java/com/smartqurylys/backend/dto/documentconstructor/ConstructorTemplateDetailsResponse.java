package com.smartqurylys.backend.dto.documentconstructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConstructorTemplateDetailsResponse {
    private Long id;
    private String code;
    private String name;
    private String category;
    private String description;
    private Integer version;
    private List<Map<String, Object>> sections;
    private List<Map<String, Object>> layout;
}
