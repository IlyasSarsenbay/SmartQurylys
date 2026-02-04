package com.smartqurylys.backend.service;

import com.smartqurylys.backend.entity.PhoneVerification;
import com.smartqurylys.backend.repository.PhoneVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

// Сервис для управления верификацией номера телефона.
@Service
@RequiredArgsConstructor
public class PhoneService {

    private final PhoneVerificationRepository phoneVerificationRepository;
    private final SmsService smsService;

    // Отправляет код подтверждения на указанный номер телефона.
    public String sendVerificationCode(String phone) {
        String code = generateCode();
        LocalDateTime expiration = LocalDateTime.now().plusMinutes(5);

        phoneVerificationRepository.deleteByPhone(phone); // Удаляем старые коды для этого номера.

        PhoneVerification verification = PhoneVerification.builder()
                .phone(phone)
                .code(code)
                .expirationTime(expiration)
                .build();

        phoneVerificationRepository.save(verification);

        smsService.sendSms(phone, "Код для потдверждения номера телефона: " + code);

        return code;
    }

    // Хранилище для уже верифицированных номеров телефонов.
    private final Set<String> verifiedPhones = ConcurrentHashMap.newKeySet();

    // Проверяет код подтверждения для номера телефона.
    public boolean verifyPhoneCode(String phone, String code) {
        boolean verified = phoneVerificationRepository.findByPhoneAndCode(phone, code)
                .filter(v -> v.getExpirationTime().isAfter(LocalDateTime.now())) // Проверяем срок действия кода.
                .isPresent();

        if (verified) {
            verifiedPhones.add(phone); // Добавляем номер в список верифицированных.
            phoneVerificationRepository.deleteByPhone(phone); // Удаляем использованный код.
        }

        return verified;
    }

    // Проверяет, был ли номер телефона верифицирован.
    public boolean isPhoneVerified(String phone) {
        return verifiedPhones.contains(phone);
    }

    // Удаляет номер телефона из списка верифицированных.
    public void removeVerifiedPhone(String phone) {
        verifiedPhones.remove(phone);
    }

    // Генерирует случайный 6-значный код.
    private String generateCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }
}