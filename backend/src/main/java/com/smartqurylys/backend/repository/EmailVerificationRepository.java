package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

// Репозиторий для работы с сущностями EmailVerification.
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    // Находит запись о верификации по адресу электронной почты и коду.
    Optional<EmailVerification> findByEmailAndCode(String email, String code);

    // Удаляет запись о верификации по адресу электронной почты.
    @Modifying
    @Transactional
    void deleteByEmail(String email);
}