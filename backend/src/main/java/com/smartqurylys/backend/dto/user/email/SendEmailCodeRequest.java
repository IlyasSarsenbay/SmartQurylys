package com.smartqurylys.backend.dto.user.email;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Объект передачи данных для запроса на отправку кода подтверждения по электронной почте.
@Data
public class SendEmailCodeRequest {
    @NotBlank(message = "Требуется почта")
    @Email(message = "Некорректный формат почты")
    private String email; // Адрес электронной почты для отправки кода.
}