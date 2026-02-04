package com.smartqurylys.backend.dto.user.phone;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Объект передачи данных для запроса на отправку кода подтверждения по номеру телефона.
@Data
public class SendPhoneCodeRequest {
    @NotBlank(message = "Требуется номер телефона")
    private String phone; // Номер телефона для отправки кода.
}