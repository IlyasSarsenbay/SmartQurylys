package com.smartqurylys.backend.dto.user.email;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Объект передачи данных для запроса на изменение электронной почты пользователя.
@Data
public class ChangeEmailRequest {

    @NotBlank(message = "Требуется почта")
    @Email(message = "Неправильный формат почты")
    private String newEmail; // Новый адрес электронной почты.
}
