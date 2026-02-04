package com.smartqurylys.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Объект передачи данных для запроса на восстановление пароля.
@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Требуется почта или номер телефона")
    private String contact; // Контактная информация (почта или номер телефона) пользователя.
}