package com.smartqurylys.backend.dto.project.taskboard;

import com.smartqurylys.backend.shared.enums.ProjectTaskBoardPriority;
import com.smartqurylys.backend.shared.enums.ProjectTaskBoardStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProjectTaskBoardTaskResponse {
    private Long id;
    private Long stageId;
    private Long parentTaskId;
    private String title;
    private String description;
    private ProjectTaskBoardStatus status;
    private ProjectTaskBoardPriority priority;
    private LocalDate dueDate;
    private Integer position;
    private ProjectTaskBoardAssigneeResponse assignee;
    private ProjectTaskBoardUserSummaryResponse createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long commentCount;
    private List<ProjectTaskBoardTaskResponse> subtasks;
}
