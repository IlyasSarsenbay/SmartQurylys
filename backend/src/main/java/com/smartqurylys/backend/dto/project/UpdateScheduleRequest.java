package com.smartqurylys.backend.dto.project;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Объект передачи данных для запроса на обновление существующего графика работ.
@Data
public class UpdateScheduleRequest {

    @NotBlank
    private String name; // Новое название графика работ.
}