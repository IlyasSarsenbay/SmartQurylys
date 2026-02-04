package com.smartqurylys.backend.dto.project;

import com.smartqurylys.backend.entity.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    @com.fasterxml.jackson.annotation.JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;
    private NotificationType type;
    private Long projectId;
    private String senderName;
    private Long relatedEntityId;
}
