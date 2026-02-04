package com.smartqurylys.backend.dto.project.document;

import lombok.*;

// Объект передачи данных для пункта сметы.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstimateItemDto {
    private Long id; // Идентификатор пункта сметы.
    private String name; // Название пункта.
    private String unit; // Единица измерения.
    private float unitPrice; // Цена за единицу.
    private float quantity; // Количество.
    private float totalCost; // Общая стоимость.
}