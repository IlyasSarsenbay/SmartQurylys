package com.smartqurylys.backend.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageRequest {
    @NotNull(message = "Требуется ID беседы")
    private Long conversationId; // К какой беседе относится сообщение

    private String content; // Текст сообщения (может быть null для сообщений только с файлом)
    private String tempFileId; // Временный ID для прикрепленного файла (если есть)

    // Тип сообщения (TEXT, COORDINATION_REQUEST, ACKNOWLEDGEMENT_REQUEST и т.д.)
    @NotNull(message = "Требуется тип сообщения")
    private String messageType;

    private List<Long> mentionedUserIds; // ID пользователей для @упоминаний

    private Long relatedMessageId; // ID сообщения, на которое это сообщение является ответом/действием

    // Дополнительные метаданные в формате JSON (например, {"documentName": "смета"}, {"status": "APPROVED"})
    private Map<String, String> metaData;
}