package com.smartqurylys.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentionNotificationRequest {
    private Long mentionedUserId; // ID пользователя, которого упоминают
    private Long conversationId;  // ID беседы, где произошло упоминание
}
