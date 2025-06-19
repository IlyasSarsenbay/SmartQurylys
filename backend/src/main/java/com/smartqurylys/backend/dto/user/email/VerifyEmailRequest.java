package com.smartqurylys.backend.dto.user.email;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyEmailRequest {

    @NotBlank(message = "Требуется почта")
    @Email(message = "Некорректный формат почты")
    private String email;

    @NotBlank(message = "Требуется код")
    private String code;
}
