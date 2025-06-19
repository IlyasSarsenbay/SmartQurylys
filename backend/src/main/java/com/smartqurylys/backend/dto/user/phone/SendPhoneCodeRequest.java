package com.smartqurylys.backend.dto.user.phone;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendPhoneCodeRequest {
    @NotBlank(message = "Требуется номер телефона")
    private String phone;
}