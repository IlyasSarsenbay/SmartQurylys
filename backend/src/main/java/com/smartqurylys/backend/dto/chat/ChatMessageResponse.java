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

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long conversationId;
    private UserResponse sender; // Информация об отправителе
    private String content;
    private FileResponse attachedFile; // Информация о прикрепленном файле
    private LocalDateTime timestamp;
    private String messageType; // Строковое представление MessageType
    private List<UserResponse> mentionedUsers; // Отмеченные пользователи
    private String coordinationStatus; // Строковое представление CoordinationStatus (PENDING, APPROVED, REJECTED)
    private String acknowledgementStatus; // Строковое представление AcknowledgementStatus (PENDING, ACKNOWLEDGED)
    private Long relatedMessageId; // ID связанного сообщения
    private Map<String, String> metaData; // Метаданные
}