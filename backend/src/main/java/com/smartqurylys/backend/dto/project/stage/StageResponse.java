package com.smartqurylys.backend.dto.project.stage;

import com.smartqurylys.backend.shared.enums.StageStatus;
import lombok.Data;

import java.time.LocalDate;

// Объект передачи данных для ответа с информацией об этапе графика работ.
@Data
public class StageResponse {
    private Long id; // Идентификатор этапа.
    private String name; // Название этапа.
    private String description; // Описание этапа.
    private LocalDate startDate; // Дата начала этапа.
    private LocalDate endDate; // Дата окончания этапа.
    private String contractors; // Список подрядчиков, назначенных на этап.
//    private String resources;
    private StageStatus status; // Текущий статус этапа.
}