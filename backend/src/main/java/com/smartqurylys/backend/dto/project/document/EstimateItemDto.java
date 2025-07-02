package com.smartqurylys.backend.dto.project.document;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstimateItemDto {
    private Long id;
    private String name;
    private String unit;
    private float unitPrice;
    private float quantity;
    private float totalCost;
}