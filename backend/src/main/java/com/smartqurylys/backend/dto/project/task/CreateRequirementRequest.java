package com.smartqurylys.backend.dto.project.task;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Объект передачи данных для запроса на создание нового требования к задаче.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRequirementRequest {
    @NotBlank(message = "Требуется описание требования")
    private String description; // Описание требования.

    private String tempFileId; // Временный ID для прикрепленного файла, если есть.
}