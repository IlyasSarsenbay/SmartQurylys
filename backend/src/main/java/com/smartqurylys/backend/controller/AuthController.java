package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.user.*;
import com.smartqurylys.backend.dto.auth.AuthResponse;
import com.smartqurylys.backend.dto.auth.LoginRequest;
import com.smartqurylys.backend.dto.auth.RegisterRequest;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.service.*;
import com.smartqurylys.backend.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

// Контроллер для аутентификации и регистрации пользователей.
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PhoneService phoneService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Регистрация нового пользователя и его аутентификация.
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerAndAuthenticate(request));
    }

    // Вход пользователя в систему.
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(token);
    }

    // Запрос на сброс пароля. Отправляет код на почту или телефон.
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String contact = request.getContact();

        if (contact.contains("@")) {
            emailService.sendVerificationCode(contact);
        } else {
            phoneService.sendVerificationCode(contact);
        }

        return ResponseEntity.ok("Код отправлен на " + contact);
    }

    // Сброс пароля с использованием проверочного кода.
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        String contact = request.getContact();
        boolean isEmail = contact.contains("@");

        // Проверяем код
        boolean verified = isEmail
                ? emailService.verifyEmailCode(contact, request.getCode())
                : phoneService.verifyPhoneCode(contact, request.getCode());

        if (!verified) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Неверный или просроченный код");
        }

        // Находим пользователя и меняем пароль
        Optional<User> userOpt = isEmail
                ? userRepository.findByEmail(contact)
                : userRepository.findByPhone(contact);

        User user = userOpt.orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Удаляем использованный код
        if (isEmail) {
            emailService.removeVerifiedEmail(contact);
        } else {
            phoneService.removeVerifiedPhone(contact);
        }

        return ResponseEntity.ok("Пароль был успешно изменен");
    }
}
