package com.smartqurylys.backend.dto.project.participant;

import lombok.Builder;
import lombok.Data;

// Объект передачи данных для запроса на обновление информации об участнике проекта.
@Data
@Builder
public class UpdateParticipantRequest {
    private String role; // Новая роль участника.
    private Boolean canUploadDocuments; // Новое значение для права загрузки документов.
    private Boolean canSendNotifications; // Новое значение для права отправки уведомлений.
}
