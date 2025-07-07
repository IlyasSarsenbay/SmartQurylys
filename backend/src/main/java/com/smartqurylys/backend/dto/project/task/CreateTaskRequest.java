package com.smartqurylys.backend.dto.project.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTaskRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String info;

    @NotBlank
    private String description;
    
    private Long participantId;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;
}
