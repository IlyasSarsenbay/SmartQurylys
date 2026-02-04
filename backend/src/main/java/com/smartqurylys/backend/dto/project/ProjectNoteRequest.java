package com.smartqurylys.backend.dto.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// DTO для запроса на создание заметки проекта.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectNoteRequest {
    private String content; // Содержимое заметки.
}
