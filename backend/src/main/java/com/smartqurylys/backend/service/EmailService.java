package com.smartqurylys.backend.service;

import com.smartqurylys.backend.entity.EmailVerification;
import com.smartqurylys.backend.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final MailService mailService;

    private final Set<String> verifiedEmails = ConcurrentHashMap.newKeySet();

    public String sendVerificationCode(String email) {
        String code = generateCode();
        LocalDateTime expiration = LocalDateTime.now().plusMinutes(5);

        emailVerificationRepository.deleteByEmail(email);

        EmailVerification verification = EmailVerification.builder()
                .email(email)
                .code(code)
                .expirationTime(expiration)
                .build();
        emailVerificationRepository.save(verification);

        mailService.send(email, "Код для подтверждения почты", "Ваш код: " + code);

        return code;
    }
    public boolean verifyEmailCode(String email, String code) {
        boolean verified = emailVerificationRepository.findByEmailAndCode(email, code)
                .filter(v -> v.getExpirationTime().isAfter(LocalDateTime.now()))
                .isPresent();

        if (verified) {
            verifiedEmails.add(email);
            emailVerificationRepository.deleteByEmail(email);
        }

        return verified;
    }

    public boolean isEmailVerified(String email) {
        return verifiedEmails.contains(email);
    }

    public void removeVerifiedEmail(String email) {
        verifiedEmails.remove(email);
    }

    private String generateCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }
}
