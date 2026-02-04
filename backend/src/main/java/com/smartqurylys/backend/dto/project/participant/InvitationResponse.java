package com.smartqurylys.backend.dto.project.participant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

// Объект передачи данных для ответа с информацией о приглашении в проект.
@Data
@Builder
@AllArgsConstructor
public class InvitationResponse {
    private Long id; // Идентификатор приглашения.
    private String projectName; // Название проекта, в который приглашают.
    private String userFullName; // Полное имя пользователя, которого приглашают.
    private String role; // Роль, предлагаемая приглашенному.
    private boolean canUploadDocuments; // Может ли приглашенный загружать документы.
    private boolean canSendNotifications; // Может ли приглашенный отправлять уведомления.
    private LocalDateTime createdAt; // Дата и время создания приглашения.
    private LocalDateTime expiresAt; // Дата и время истечения срока действия приглашения.
}
