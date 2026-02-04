package com.smartqurylys.backend.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

// Объект передачи данных для запроса на отправку сообщения в чат.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageRequest {
    @NotNull(message = "Требуется ID беседы")
    private Long conversationId; // Идентификатор беседы, к которой относится сообщение.

    private String content; // Текст сообщения (может быть пустым, если прикреплен только файл).
    private String tempFileId; // Временный ID для прикрепленного файла, если таковой имеется.

    // Тип сообщения (например, TEXT, COORDINATION_REQUEST, ACKNOWLEDGEMENT_REQUEST).
    @NotNull(message = "Требуется тип сообщения")
    private String messageType;

    private List<Long> mentionedUserIds; // ID пользователей, упомянутых в сообщении.

    private Long relatedMessageId; // ID сообщения, на которое текущее сообщение является ответом или действием.

    // Дополнительные метаданные в формате ключ-значение (например, {"documentName": "смета"}, {"status": "APPROVED"}).
    private Map<String, String> metaData;
}