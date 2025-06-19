package com.smartqurylys.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Требуется нынешний пароль")
    private String currentPassword;

    @NotBlank(message = "Требуется новый пароль")
    @Size(min = 8, message = "Пароль должен стоять как минимум из 8 символов")
    private String newPassword;
}
