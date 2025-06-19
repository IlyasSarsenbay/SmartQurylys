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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PhoneService phoneService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerAndAuthenticate(request));
    }


    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(token);
    }

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

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        String contact = request.getContact();
        boolean isEmail = contact.contains("@");

        boolean verified = isEmail
                ? emailService.verifyEmailCode(contact, request.getCode())
                : phoneService.verifyPhoneCode(contact, request.getCode());

        if (!verified) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Неверный или просроченный код");
        }

        Optional<User> userOpt = isEmail
                ? userRepository.findByEmail(contact)
                : userRepository.findByPhone(contact);

        User user = userOpt.orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        if (isEmail) {
            emailService.removeVerifiedEmail(contact);
        } else {
            phoneService.removeVerifiedPhone(contact);
        }

        return ResponseEntity.ok("Пароль был успешно изменен");
    }

}
