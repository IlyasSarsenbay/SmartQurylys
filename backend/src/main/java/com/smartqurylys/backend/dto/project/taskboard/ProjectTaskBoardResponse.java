package com.smartqurylys.backend.dto.project.taskboard;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProjectTaskBoardResponse {
    private Long projectId;
    private List<ProjectTaskBoardStageResponse> stages;
}
