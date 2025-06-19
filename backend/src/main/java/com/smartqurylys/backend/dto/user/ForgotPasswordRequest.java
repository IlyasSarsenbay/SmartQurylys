package com.smartqurylys.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Требуется почта или номер телефона")
    private String contact;
}