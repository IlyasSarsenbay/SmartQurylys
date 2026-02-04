package com.smartqurylys.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// Объект передачи данных для ответа с информацией о пользователе.
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserResponse {
    private Long id; // Идентификатор пользователя.
    private String fullName; // Полное имя пользователя.
    private String email; // Электронная почта пользователя.
    private String phone; // Номер телефона пользователя.
    private String iinBin; // ИИН/БИН пользователя.
    private String city; // Город проживания пользователя.
    private String organization; // Организация пользователя
    private String role; // Роль пользователя
    private String userType; // Тип пользователя (например, USER, ORGANISATION)
}
