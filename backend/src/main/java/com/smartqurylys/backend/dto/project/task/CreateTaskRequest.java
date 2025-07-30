package com.smartqurylys.backend.dto.project.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateTaskRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String info;

    @NotBlank
    private String description;

    private List<Long> responsiblePersonIds;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    private List<CreateRequirementRequest> requirements;
}
