package com.smartqurylys.backend.dto.project.task;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateTaskRequest {
    private String name;
    private String info;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long participantId;
}
