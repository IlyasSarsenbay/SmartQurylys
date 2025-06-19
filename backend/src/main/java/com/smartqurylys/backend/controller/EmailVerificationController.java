package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.user.email.SendEmailCodeRequest;
import com.smartqurylys.backend.dto.user.email.VerifyEmailRequest;
import com.smartqurylys.backend.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailService emailService;

    @PostMapping("/send-code")
    public ResponseEntity<String> sendCode(@Valid @RequestBody SendEmailCodeRequest request) {
        emailService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok("Код отправлен на: " + request.getEmail());
    }

    @PostMapping("/verify-code")
    public ResponseEntity<String> verifyCode(@Valid @RequestBody VerifyEmailRequest request) {
        boolean success = emailService.verifyEmailCode(request.getEmail(), request.getCode());

        if (success) {
            return ResponseEntity.ok("Почта успешно подтверждена");
        } else {
            return ResponseEntity.badRequest().body("Неверный или просроченный код");
        }
    }
}
