package com.smartqurylys.backend.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Требуется имя")
    private String fullName;

    @NotBlank(message = "Требуется почта")
    @Email(message = "Некорректный формат почты")
    private String email;

    @NotBlank(message = "Требуется пароль")
    @Size(min = 8, message = "Пароль должен стоять как минимум из 8 символов")
    private String password;

    @NotBlank(message = "Требуется номер телефона")
    private String phone;

    @NotBlank(message = "Требуется организация")
    private String organization;

    @NotBlank(message = "Требуется ИИН/БИН")
    @Pattern(regexp = "\\d{12}", message = "ИИН/БИН должен состоять из 12 цифр")
    private String iinBin;

    @NotNull
    private Long cityId;
}
