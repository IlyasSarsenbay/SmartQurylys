package com.smartqurylys.backend.dto.user.phone;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Объект передачи данных для запроса на верификацию номера телефона с использованием кода.
@Data
public class VerifyPhoneRequest {
    @NotBlank(message = "Требуется номер телефона")
    private String phone; // Номер телефона для верификации.

    @NotBlank(message = "Требуется код")
    private String code; // Код подтверждения, полученный по СМС.
}
