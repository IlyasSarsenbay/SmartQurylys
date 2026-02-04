package com.smartqurylys.backend.dto.project.participant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Объект передачи данных для ответа с информацией об участнике проекта.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantResponse {
    private Long id; // Идентификатор участника.
    private String fullName; // Полное имя участника.
    private String iinBin; // ИИН/БИН участника.
    private String role; // Роль участника в проекте.
    private String organization; // Организация участника.
    private String phone; // Телефон участника.
    private String email; // Почта участника.
    private boolean canUploadDocuments; // Имеет ли право загружать документы.
    private boolean canSendNotifications; // Имеет ли право отправлять уведомления.
}
