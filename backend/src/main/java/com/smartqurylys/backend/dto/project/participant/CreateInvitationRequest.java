package com.smartqurylys.backend.dto.project.participant;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Объект передачи данных для запроса на отправку приглашения в проект.
@Data
public class CreateInvitationRequest {

    @NotBlank(message = "Требуется ИИН/БИН")
    private String iinBin; // ИИН/БИН пользователя, которого приглашают.

    @NotBlank(message = "Требуется роль")
    private String role; // Роль, которую получит приглашенный пользователь.

    private boolean canUploadDocuments; // Может ли приглашенный загружать документы.

    private boolean canSendNotifications; // Может ли приглашенный отправлять уведомления.
}