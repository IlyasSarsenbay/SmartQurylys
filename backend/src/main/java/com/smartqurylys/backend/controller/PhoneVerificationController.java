package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.user.phone.SendPhoneCodeRequest;
import com.smartqurylys.backend.dto.user.phone.VerifyPhoneRequest;
import com.smartqurylys.backend.service.PhoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/phone")
@RequiredArgsConstructor
public class PhoneVerificationController {

    private final PhoneService phoneService;

    @PostMapping("/send-code")
    public ResponseEntity<String> sendCode(@RequestBody @Valid SendPhoneCodeRequest request) {
        phoneService.sendVerificationCode(request.getPhone());
        return ResponseEntity.ok("Код отправлен на номер " + request.getPhone());
    }

    @PostMapping("/verify-code")
    public ResponseEntity<String> verifyCode(@RequestBody @Valid VerifyPhoneRequest request) {
        boolean isValid = phoneService.verifyPhoneCode(request.getPhone(), request.getCode());
        if (isValid) {
            return ResponseEntity.ok("Код подтверждён");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Неверный или истёкший код");
        }
    }
}

