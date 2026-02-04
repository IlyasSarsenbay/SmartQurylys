package com.smartqurylys.backend.dto.auth;

import lombok.Data;

// DTO для запроса на вход в систему.
@Data
public class LoginRequest {
    private String email;
    private String password;
}