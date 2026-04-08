package com.smartqurylys.backend.dto.project.taskboard;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectTaskBoardUserSummaryResponse {
    private Long id;
    private String fullName;
}
