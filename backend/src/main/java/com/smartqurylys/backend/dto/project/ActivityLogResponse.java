package com.smartqurylys.backend.dto.project;

import com.smartqurylys.backend.shared.enums.ActivityActionType;
import com.smartqurylys.backend.shared.enums.ActivityEntityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Объект передачи данных для ответа с записью журнала активности.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogResponse {
    private Long id; // Идентификатор записи.
    private LocalDateTime timestamp; // Время выполнения действия.
    private Long actorId; // ID пользователя, совершившего действие.
    private String actorFullName; // Полное имя пользователя.
    private ActivityActionType actionType; // Тип действия (например, CREATE, UPDATE, DELETE).
    private ActivityEntityType entityType; // Тип сущности, над которой совершено действие (например, PROJECT, TASK).
    private Long entityId; // ID сущности.
    private String entityName; // Название сущности.
//    private String details;
    private Long projectId; // ID проекта, к которому относится активность.
}