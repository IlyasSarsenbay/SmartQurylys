package com.smartqurylys.backend.dto.project.task;

import com.smartqurylys.backend.dto.project.participant.ParticipantResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private String name;
    private String description;
    private String info;
    private List<ParticipantResponse> responsiblePersons;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isPriority;
    private boolean executionRequested;
    private boolean executionConfirmed;
    private List<Long> dependsOnTaskIds;
    private List<RequirementResponse> requirements;
}
