package com.smartqurylys.backend.dto.project;

import com.smartqurylys.backend.shared.enums.ProjectStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateProjectRequest {
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String type;
    private ProjectStatus status;
    private Long cityId;
}