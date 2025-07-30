package com.smartqurylys.backend.dto.project;

import com.smartqurylys.backend.shared.enums.ActivityActionType;
import com.smartqurylys.backend.shared.enums.ActivityEntityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogResponse {
    private Long id;
    private LocalDateTime timestamp;
    private Long actorId;
    private String actorFullName;
    private ActivityActionType actionType;
    private ActivityEntityType entityType;
    private Long entityId;
    private String entityName;
//    private String details;
    private Long projectId;
}