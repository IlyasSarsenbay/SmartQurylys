package com.smartqurylys.backend.dto.project.task;

import com.smartqurylys.backend.dto.project.FileResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequirementResponse {
    private Long id;
    private String description;
    private FileResponse sampleFile;
}