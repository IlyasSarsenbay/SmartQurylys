package com.smartqurylys.backend.dto.project.taskboard;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateProjectTaskCommentRequest {
    @NotBlank
    private String message;
}
