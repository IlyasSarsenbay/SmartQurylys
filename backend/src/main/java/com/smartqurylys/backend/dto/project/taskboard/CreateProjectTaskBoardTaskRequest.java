package com.smartqurylys.backend.dto.project.taskboard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateProjectTaskBoardTaskRequest {
    @NotNull
    private Long stageId;

    private Long parentTaskId;

    @NotBlank
    private String title;
}
