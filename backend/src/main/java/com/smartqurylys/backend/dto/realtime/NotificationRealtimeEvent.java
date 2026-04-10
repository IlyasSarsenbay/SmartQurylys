package com.smartqurylys.backend.dto.realtime;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class NotificationRealtimeEvent {
    Long userId;
    String type;
    Long notificationId;
    LocalDateTime occurredAt;
}
