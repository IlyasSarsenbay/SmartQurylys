package com.smartqurylys.backend.dto.project.document;

import lombok.*;

import java.util.List;

// Объект передачи данных для ответа со сметой.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstimateResponse {
    private Long id; // Идентификатор сметы.
    private String name; // Название сметы.
//    private boolean includeNDS;
    private float totalCost; // Общая стоимость сметы.
    private float totalCostWithoutNDS; // Общая стоимость сметы без НДС.
    private List<EstimateItemDto> items; // Список пунктов сметы.
}
