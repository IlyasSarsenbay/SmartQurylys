package com.smartqurylys.backend.dto.user.email;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Объект передачи данных для запроса на верификацию электронной почты с использованием кода.
@Data
public class VerifyEmailRequest {

    @NotBlank(message = "Требуется почта")
    @Email(message = "Некорректный формат почты")
    private String email; // Адрес электронной почты для верификации.

    @NotBlank(message = "Требуется код")
    private String code; // Код подтверждения, полученный по почте.
}
