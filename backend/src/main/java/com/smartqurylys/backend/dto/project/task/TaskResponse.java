package com.smartqurylys.backend.dto.project.task;

import com.smartqurylys.backend.entity.Participant;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private String name;
    private String description;
    private String info;
    private String participantName;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isPriority;
    private boolean executionRequested;
    private boolean executionConfirmed;
}
