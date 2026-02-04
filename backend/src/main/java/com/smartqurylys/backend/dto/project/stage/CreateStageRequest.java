package com.smartqurylys.backend.dto.project.stage;

import com.smartqurylys.backend.shared.enums.StageStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

// Объект передачи данных для запроса на создание нового этапа в графике работ.
@Data
public class CreateStageRequest {
    @NotBlank
    private String name; // Название этапа.

    @NotBlank
    private String description; // Описание этапа.

    @NotNull
    private LocalDate startDate; // Дата начала этапа.

    @NotNull
    private LocalDate endDate; // Дата окончания этапа.

    private String contractors; // Подрядчики, ответственные за этап.

//    @NotBlank
//    private String resources;

//    @NotNull
//    private StageStatus status;
}
