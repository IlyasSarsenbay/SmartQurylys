package com.smartqurylys.backend.dto.user;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// Объект передачи данных для ответа с информацией о пользователе.
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UpdateUserRequest {
    private Long id; // Идентификатор пользователя.
    private String fullName; // Полное имя пользователя.
    private String phone; // Номер телефона пользователя.
    private String iinBin; // ИИН/БИН пользователя.
    private Long cityId;
}
