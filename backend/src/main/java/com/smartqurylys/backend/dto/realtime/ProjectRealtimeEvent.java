package com.smartqurylys.backend.dto.realtime;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProjectRealtimeEvent {
    private Long projectId;
    private String type;
    private Long entityId;
    private LocalDateTime occurredAt;
}
