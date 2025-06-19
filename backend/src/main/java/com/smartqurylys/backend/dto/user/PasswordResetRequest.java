package com.smartqurylys.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordResetRequest {
    @NotBlank(message = "Требуется почта или номер телефона")
    private String contact;

    @NotBlank(message = "Требуется код")
    private String code;

    @NotBlank(message = "Требуется пароль")
    @Size(min = 8, message = "Пароль должен стоять как минимум из 8 символов")
    private String newPassword;
}