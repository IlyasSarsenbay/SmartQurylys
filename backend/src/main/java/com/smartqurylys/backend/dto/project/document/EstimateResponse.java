package com.smartqurylys.backend.dto.project.document;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstimateResponse {
    private Long id;
    private String name;
//    private boolean includeNDS;
    private float totalCost;
    private float totalCostWithoutNDS;
    private List<EstimateItemDto> items;
}
