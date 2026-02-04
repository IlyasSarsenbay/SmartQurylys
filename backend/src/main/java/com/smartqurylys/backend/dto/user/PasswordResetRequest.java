package com.smartqurylys.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

// Объект передачи данных для запроса на сброс пароля.
@Data
public class PasswordResetRequest {
    @NotBlank(message = "Требуется почта или номер телефона")
    private String contact; // Контактная информация (почта или номер телефона) пользователя.

    @NotBlank(message = "Требуется код")
    private String code; // Код подтверждения, полученный на контактную информацию.

    @NotBlank(message = "Требуется пароль")
    @Size(min = 8, message = "Пароль должен стоять как минимум из 8 символов")
    private String newPassword; // Новый пароль.
}