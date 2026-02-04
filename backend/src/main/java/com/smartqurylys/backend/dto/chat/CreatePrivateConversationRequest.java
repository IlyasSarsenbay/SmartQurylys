package com.smartqurylys.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotNull;

// Объект передачи данных для запроса на создание личной беседы.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePrivateConversationRequest {
    @NotNull(message = "ID целевого пользователя не может быть пустым")
    private Long targetUserId; // Идентификатор пользователя, с которым создается беседа.

    private String name; // Название беседы (опционально).
}
