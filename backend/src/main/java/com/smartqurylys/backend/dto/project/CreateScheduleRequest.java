package com.smartqurylys.backend.dto.project;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateScheduleRequest {
    @NotBlank
    private String name;
}