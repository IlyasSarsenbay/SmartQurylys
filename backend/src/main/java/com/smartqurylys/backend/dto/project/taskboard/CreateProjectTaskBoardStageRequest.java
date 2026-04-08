package com.smartqurylys.backend.dto.project.taskboard;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateProjectTaskBoardStageRequest {
    @NotBlank
    private String name;
}
