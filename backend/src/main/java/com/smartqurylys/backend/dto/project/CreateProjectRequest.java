package com.smartqurylys.backend.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

// Объект передачи данных для запроса на создание нового проекта.
@Data
public class CreateProjectRequest {
    @NotBlank(message = "Требуется название")
    private String name; // Название проекта.

    @NotBlank(message = "Требуется описание")
    private String description; // Описание проекта.

    @NotBlank(message = "Требуется тип")
    private String type; // Тип проекта.

    @NotNull
    private Long cityId; // Идентификатор города, где реализуется проект.

    @NotNull(message = "Требуется планируемый срок начала")
    private LocalDate startDate; // Планируемая дата начала проекта.

    @NotNull(message = "Требуется планируемый срок окончания")
    private LocalDate endDate; // Планируемая дата окончания проекта.
}


