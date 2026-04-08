package com.smartqurylys.backend.dto.project.taskboard;

import com.smartqurylys.backend.shared.enums.ProjectTaskBoardPriority;
import com.smartqurylys.backend.shared.enums.ProjectTaskBoardStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateProjectTaskBoardTaskRequest {
    private Long stageId;
    private Long parentTaskId;
    private Boolean clearParentTask;
    private String title;
    private String description;
    private ProjectTaskBoardStatus status;
    private ProjectTaskBoardPriority priority;
    private LocalDate dueDate;
    private Boolean clearDueDate;
    private Long assigneeParticipantId;
    private Boolean clearAssignee;
    private Integer position;
}
