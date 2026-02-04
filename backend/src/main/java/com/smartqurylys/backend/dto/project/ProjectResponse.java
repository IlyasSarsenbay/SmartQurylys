package com.smartqurylys.backend.dto.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// Объект передачи данных для ответа с информацией о проекте.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private Long id; // Идентификатор проекта.
    private String name; // Название проекта.
    private String description; // Описание проекта.
    private LocalDate startDate; // Дата начала проекта.
    private LocalDate endDate; // Дата окончания проекта.
    private String type; // Тип проекта.
    private String status; // Текущий статус проекта.
    private String cityName; // Название города, где реализуется проект.
    private String ownerIinBin; // ИИН/БИН владельца проекта.
    private String ownerName; // Имя владельца проекта.
    private ScheduleResponse schedule; // Расписание проекта.
}
