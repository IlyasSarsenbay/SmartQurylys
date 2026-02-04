package com.smartqurylys.backend.service;

import com.smartqurylys.backend.entity.EmailVerification;
import com.smartqurylys.backend.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

// Сервис для управления верификацией электронной почты.
@Service
@RequiredArgsConstructor
public class EmailService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final MailService mailService;

    // Хранилище для уже верифицированных email-адресов.
    private final Set<String> verifiedEmails = ConcurrentHashMap.newKeySet();

    // Отправляет код подтверждения на указанный адрес электронной почты.
    public String sendVerificationCode(String email) {
        String code = generateCode();
        LocalDateTime expiration = LocalDateTime.now().plusMinutes(5);

        emailVerificationRepository.deleteByEmail(email); // Удаляем старые коды для этого email.

        EmailVerification verification = EmailVerification.builder()
                .email(email)
                .code(code)
                .expirationTime(expiration)
                .build();
        emailVerificationRepository.save(verification);

        mailService.send(email, "Код для подтверждения почты", "Ваш код: " + code);

        return code;
    }

    // Проверяет код подтверждения для электронной почты.
    public boolean verifyEmailCode(String email, String code) {
        boolean verified = emailVerificationRepository.findByEmailAndCode(email, code)
                .filter(v -> v.getExpirationTime().isAfter(LocalDateTime.now())) // Проверяем срок действия кода.
                .isPresent();

        if (verified) {
            verifiedEmails.add(email); // Добавляем email в список верифицированных.
            emailVerificationRepository.deleteByEmail(email); // Удаляем использованный код.
        }

        return verified;
    }

    // Проверяет, был ли адрес электронной почты верифицирован.
    public boolean isEmailVerified(String email) {
        return verifiedEmails.contains(email);
    }

    // Удаляет адрес электронной почты из списка верифицированных.
    public void removeVerifiedEmail(String email) {
        verifiedEmails.remove(email);
    }

    // Генерирует случайный 6-значный код.
    private String generateCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }
}
