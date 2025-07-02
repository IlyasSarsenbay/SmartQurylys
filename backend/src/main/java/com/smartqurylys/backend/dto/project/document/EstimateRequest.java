package com.smartqurylys.backend.dto.project.document;

import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstimateRequest {
    private String name;
//    private boolean includeNDS;
    private float overheadsAmount;
    private float reserveAmount;
    private float transportAmount;
}