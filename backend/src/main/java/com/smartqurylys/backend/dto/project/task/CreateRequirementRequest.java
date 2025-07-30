package com.smartqurylys.backend.dto.project.task;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRequirementRequest {
    @NotBlank(message = "Требуется описание требования")
    private String description;

    private String tempFileId;
}