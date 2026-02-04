package com.smartqurylys.backend.dto.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

// Объект передачи данных для ответа с информацией о графике работ.
@Data
@Builder
@AllArgsConstructor
public class ScheduleResponse {
    private Long id; // Идентификатор графика работ.
    private String name; // Название графика работ.
    private String projectName; // Название проекта, к которому относится график.
    private LocalDateTime createdAt; // Дата и время создания графика.
}