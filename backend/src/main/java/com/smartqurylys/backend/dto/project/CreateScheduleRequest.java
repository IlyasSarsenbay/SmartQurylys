package com.smartqurylys.backend.dto.project;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Объект передачи данных для запроса на создание нового графика работ.
@Data
public class CreateScheduleRequest {
    @NotBlank
    private String name; // Название графика работ.
}