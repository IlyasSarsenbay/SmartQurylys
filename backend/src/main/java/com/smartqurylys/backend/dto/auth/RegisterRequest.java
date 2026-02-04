package com.smartqurylys.backend.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

// DTO для запроса на регистрацию нового пользователя.
@Data
public class RegisterRequest {

    @NotBlank(message = "Требуется имя")
    private String fullName;

    @NotBlank(message = "Требуется почта")
    @Email(message = "Некорректный формат почты")
    private String email;

    private String password;

    @NotBlank(message = "Требуется номер телефона")
    private String phone;

    @NotBlank(message = "Требуется ИИН/БИН")
    @Pattern(regexp = "\\d{12}", message = "ИИН/БИН должен состоять из 12 цифр")
    private String iinBin;

    @NotNull
    private Long cityId;
}
