package com.smartqurylys.backend.dto.project.taskboard;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProjectTaskBoardStageResponse {
    private Long id;
    private String name;
    private Integer position;
    private int taskCount;
    private List<ProjectTaskBoardTaskResponse> tasks;
}
