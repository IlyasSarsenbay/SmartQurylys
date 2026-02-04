package com.smartqurylys.backend.dto.project.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

// Объект передачи данных для запроса на создание новой задачи.
@Data
public class CreateTaskRequest {
    @NotBlank
    private String name; // Название задачи.

    private String info; // Дополнительная информация о задаче.

    @NotBlank
    private String description; // Описание задачи.

    private List<Long> responsiblePersonIds; // ID ответственных за задачу.

    @NotNull
    private LocalDate startDate; // Дата начала задачи.

    @NotNull
    private LocalDate endDate; // Дата окончания задачи.

    @com.fasterxml.jackson.annotation.JsonProperty("isPriority")
    private boolean isPriority; // Флаг приоритета задачи.

    private List<CreateRequirementRequest> requirements; // Список требований для задачи.
}
