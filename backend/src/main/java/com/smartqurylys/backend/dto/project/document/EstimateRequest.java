package com.smartqurylys.backend.dto.project.document;

import lombok.*;

// Объект передачи данных для запроса на создание или обновление сметы.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstimateRequest {
    private String name; // Название сметы.
//    private boolean includeNDS;
    private float overheadsAmount; // Сумма накладных расходов.
    private float reserveAmount; // Сумма резервных средств.
    private float transportAmount; // Сумма транспортных расходов.
}