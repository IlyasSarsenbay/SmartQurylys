package com.smartqurylys.backend.dto.chat;

import com.smartqurylys.backend.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {
    private Long id;
    private String type; // PROJECT_CHAT, PRIVATE_CHAT (строковое представление ConversationType)
    private Long projectId; // ID проекта, если это чат проекта (null для PRIVATE_CHAT)
    private String name; // Название беседы (для личных чатов, например, "Иванов & Петров")
    private List<UserResponse> participants; // Участники беседы (для PRIVATE_CHAT)
    private LocalDateTime lastMessageTimestamp; // Время последнего сообщения
}