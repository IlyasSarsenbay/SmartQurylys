package com.smartqurylys.backend.dto.project.stage;

import com.smartqurylys.backend.shared.enums.StageStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateStageRequest {
    private String name;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private String contractors;

    private String resources;

    private StageStatus status;
}