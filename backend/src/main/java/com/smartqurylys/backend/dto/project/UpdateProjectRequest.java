package com.smartqurylys.backend.dto.project;

import com.smartqurylys.backend.shared.enums.ProjectStatus;
import lombok.Data;

import java.time.LocalDate;

// Объект передачи данных для запроса на обновление существующего проекта.
@Data
public class UpdateProjectRequest {
    private String name; // Новое название проекта.
    private String description; // Новое описание проекта.
    private LocalDate startDate; // Новая дата начала проекта.
    private LocalDate endDate; // Новая дата окончания проекта.
    private String type; // Новый тип проекта.
    private ProjectStatus status; // Новый статус проекта.
    private Long cityId; // Идентификатор нового города, связанного с проектом.
}