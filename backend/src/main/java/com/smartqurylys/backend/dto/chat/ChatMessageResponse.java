package com.smartqurylys.backend.dto.chat;

import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

// Объект передачи данных для ответа с сообщением из чата.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long conversationId;
    private UserResponse sender; // Отправитель сообщения.
    private String content;
    private FileResponse attachedFile; // Прикрепленный файл, если есть.
    private LocalDateTime timestamp;
    private String messageType; // Тип сообщения (например, TEXT, COORDINATION_REQUEST).
    private List<UserResponse> mentionedUsers; // Список пользователей, упомянутых в сообщении.
    private String coordinationStatus; // Статус координации (PENDING, APPROVED, REJECTED).
    private String acknowledgementStatus; // Статус подтверждения (PENDING, ACKNOWLEDGED).
    private Long relatedMessageId; // ID сообщения, к которому относится данное (например, ответ).
    private Map<String, String> metaData; // Дополнительные метаданные.
}