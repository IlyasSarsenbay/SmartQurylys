package com.smartqurylys.backend.dto.chat;

import com.smartqurylys.backend.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

// Объект передачи данных для ответа с информацией о беседе.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {
    private Long id;
    private String type; // Тип беседы: PROJECT_CHAT или PRIVATE_CHAT (строковое представление ConversationType).
    private Long projectId; // ID проекта, если беседа относится к проекту (null для личных бесед).
    private String name; // Название беседы (для личных чатов, например, "Иванов & Петров").
    private List<UserResponse> participants; // Список участников беседы.
    private LocalDateTime lastMessageTimestamp; // Время отправки последнего сообщения.
}