package com.smartqurylys.backend.dto.project.taskboard;

import lombok.Data;

@Data
public class UpdateProjectTaskBoardStageRequest {
    private String name;
    private Integer position;
}
