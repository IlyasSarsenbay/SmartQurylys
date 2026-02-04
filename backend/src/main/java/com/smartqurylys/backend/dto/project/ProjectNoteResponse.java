package com.smartqurylys.backend.dto.project;

import com.smartqurylys.backend.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// DTO для ответа с информацией о заметке проекта.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectNoteResponse {
    private Long id; // Идентификатор заметки.
    private Long projectId; // Идентификатор проекта.
    private UserResponse author; // Информация об авторе заметки.
    private String content; // Содержимое заметки.
    private LocalDateTime createdAt; // Дата и время создания.
}
