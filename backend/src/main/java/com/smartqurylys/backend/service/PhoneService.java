package com.smartqurylys.backend.service;

import com.smartqurylys.backend.entity.PhoneVerification;
import com.smartqurylys.backend.repository.PhoneVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PhoneService {

    private final PhoneVerificationRepository phoneVerificationRepository;
    private final SmsService smsService;

    public String sendVerificationCode(String phone) {
        String code = generateCode();
        LocalDateTime expiration = LocalDateTime.now().plusMinutes(5);

        phoneVerificationRepository.deleteByPhone(phone);

        PhoneVerification verification = PhoneVerification.builder()
                .phone(phone)
                .code(code)
                .expirationTime(expiration)
                .build();

        phoneVerificationRepository.save(verification);

        smsService.sendSms(phone, "Код для потдверждения номера телефона: " + code);

        return code;
    }
    private final Set<String> verifiedPhones = ConcurrentHashMap.newKeySet();

    public boolean verifyPhoneCode(String phone, String code) {
        boolean verified = phoneVerificationRepository.findByPhoneAndCode(phone, code)
                .filter(v -> v.getExpirationTime().isAfter(LocalDateTime.now()))
                .isPresent();

        if (verified) {
            verifiedPhones.add(phone);
            phoneVerificationRepository.deleteByPhone(phone);
        }

        return verified;
    }

    public boolean isPhoneVerified(String phone) {
        return verifiedPhones.contains(phone);
    }

    public void removeVerifiedPhone(String phone) {
        verifiedPhones.remove(phone);
    }

    private String generateCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }


}