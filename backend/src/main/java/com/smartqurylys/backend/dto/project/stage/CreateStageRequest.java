package com.smartqurylys.backend.dto.project.stage;

import com.smartqurylys.backend.shared.enums.StageStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateStageRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String description;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    private String contractors;

//    @NotBlank
//    private String resources;

//    @NotNull
//    private StageStatus status;
}
