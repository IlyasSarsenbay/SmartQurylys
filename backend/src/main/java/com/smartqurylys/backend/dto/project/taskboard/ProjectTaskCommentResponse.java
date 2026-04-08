package com.smartqurylys.backend.dto.project.taskboard;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProjectTaskCommentResponse {
    private Long id;
    private Long taskId;
    private String message;
    private ProjectTaskBoardUserSummaryResponse author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
