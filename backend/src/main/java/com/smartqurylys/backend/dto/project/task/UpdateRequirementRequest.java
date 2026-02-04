package com.smartqurylys.backend.dto.project.task;

// import jakarta.validation.constraints.NotNull; // Больше не нужен для ID в DTO
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Объект передачи данных для запроса на обновление существующего требования.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRequirementRequest {

    private String description; // Новое описание требования.
    private Boolean removeSampleFile; // Флаг, указывающий на необходимость удаления файла-образца.
    private String newSampleFileTempId; // Временный ID для нового файла-образца, если он прикреплен.
}