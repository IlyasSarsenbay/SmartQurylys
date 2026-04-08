package com.smartqurylys.backend.dto.project.taskboard;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkDeleteProjectTaskBoardTasksRequest {
    @NotEmpty
    private List<Long> taskIds;
}
