package com.smartqurylys.backend.dto.project.task;

import com.smartqurylys.backend.dto.project.FileResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Объект передачи данных для ответа с информацией о требовании.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequirementResponse {
    private Long id; // Идентификатор требования.
    private String description; // Описание требования.
    private FileResponse sampleFile; // Прикрепленный файл-образец, если есть.
}