package com.smartqurylys.backend.dto.project.task;

// import jakarta.validation.constraints.NotNull; // Больше не нужен для ID в DTO
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRequirementRequest {

    private String description;
    private Boolean removeSampleFile;
    private String newSampleFileTempId;
}