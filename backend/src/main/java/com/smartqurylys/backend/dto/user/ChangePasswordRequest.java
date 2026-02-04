package com.smartqurylys.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

// Объект передачи данных для запроса на изменение пароля пользователя.
@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Требуется нынешний пароль")
    private String currentPassword; // Текущий пароль пользователя.

    @NotBlank(message = "Требуется новый пароль")
    @Size(min = 8, message = "Пароль должен стоять как минимум из 8 символов")
    private String newPassword; // Новый пароль пользователя.
}
