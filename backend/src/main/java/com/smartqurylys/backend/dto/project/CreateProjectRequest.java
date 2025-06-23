package com.smartqurylys.backend.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateProjectRequest {
    @NotBlank(message = "Требуется название")
    private String name;

    @NotBlank(message = "Требуется описание")
    private String description;

    @NotBlank(message = "Требуется тип")
    private String type;

    @NotNull
    private Long cityId;

    @NotNull(message = "Требуется планируемый срок начала")
    private LocalDate startDate;

    @NotNull(message = "Требуется планируемый срок окончания")
    private LocalDate endDate;
}


