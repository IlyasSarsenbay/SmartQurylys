package com.smartqurylys.backend.dto.project.task;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

// Объект передачи данных для запроса на обновление существующей задачи.
@Data
public class UpdateTaskRequest {
    private String name; // Новое название задачи.
    private String info; // Обновленная дополнительная информация о задаче.
    private String description; // Новое описание задачи.
    private LocalDate startDate; // Новая дата начала задачи.
    private LocalDate endDate; // Новая дата окончания задачи.
    private List<Long> responsiblePersonIds; // Обновленный список ID ответственных лиц.
    @com.fasterxml.jackson.annotation.JsonProperty("isPriority")
    private Boolean isPriority; // Обновленный флаг приоритета задачи.
}
