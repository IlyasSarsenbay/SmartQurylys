package com.smartqurylys.backend.dto.project.task;

import com.smartqurylys.backend.dto.project.participant.ParticipantResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

// Объект передачи данных для ответа с информацией о задаче.
@Data
@Builder
public class TaskResponse {
    private Long id; // Идентификатор задачи.
    private String name; // Название задачи.
    private String description; // Описание задачи.
    private String info; // Дополнительная информация.
    private List<ParticipantResponse> responsiblePersons; // Список ответственных лиц.
    private LocalDate startDate; // Дата начала задачи.
    private LocalDate endDate; // Дата окончания задачи.
    @com.fasterxml.jackson.annotation.JsonProperty("isPriority")
    private boolean isPriority; // Флаг приоритета задачи.
    private boolean executionRequested; // Флаг запроса на выполнение.
    private boolean executionConfirmed; // Флаг подтверждения выполнения.
    private List<Long> dependsOnTaskIds; // Список ID задач, от которых зависит текущая.
    private List<RequirementResponse> requirements; // Список требований к задаче.
}
