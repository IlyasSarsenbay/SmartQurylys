package com.smartqurylys.backend.dto.auth;

import com.smartqurylys.backend.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

// DTO для ответа при аутентификации, содержит токен и информацию о пользователе.
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserResponse user;
}
