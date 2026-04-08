package com.smartqurylys.backend.dto.project;

import com.smartqurylys.backend.entity.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

// Объект передачи данных для ответа с информацией об уведомлении.
@Data
@Builder
public class NotificationResponse {
    private Long id; // Идентификатор уведомления.
    private String message; // Текст уведомления.
    @com.fasterxml.jackson.annotation.JsonProperty("isRead")
    private boolean isRead; // Флаг прочтения уведомления.
    private LocalDateTime createdAt; // Дата и время создания уведомления.
    private NotificationType type; // Тип уведомления.
    private Long projectId; // Идентификатор связанного проекта.
    private String senderName; // Имя отправителя уведомления.
    private Long relatedEntityId; // Идентификатор связанной сущности.
}
