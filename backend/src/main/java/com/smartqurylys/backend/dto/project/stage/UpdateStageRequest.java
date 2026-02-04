package com.smartqurylys.backend.dto.project.stage;

import com.smartqurylys.backend.shared.enums.StageStatus;
import lombok.Data;

import java.time.LocalDate;

// Объект передачи данных для запроса на обновление существующего этапа графика работ.
@Data
public class UpdateStageRequest {
    private String name; // Новое название этапа.

    private String description; // Новое описание этапа.

    private LocalDate startDate; // Новая дата начала этапа.

    private LocalDate endDate; // Новая дата окончания этапа.

    private String contractors; // Обновленный список подрядчиков.

//    private String resources;

    private StageStatus status; // Новый статус этапа.
}