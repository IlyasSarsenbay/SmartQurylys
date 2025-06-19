package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    Optional<EmailVerification> findByEmailAndCode(String email, String code);

    @Modifying
    @Transactional
    void deleteByEmail(String email);
}