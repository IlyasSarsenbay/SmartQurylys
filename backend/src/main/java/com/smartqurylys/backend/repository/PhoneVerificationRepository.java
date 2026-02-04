package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.PhoneVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

// Репозиторий для работы с сущностями PhoneVerification.
public interface PhoneVerificationRepository extends JpaRepository<PhoneVerification, Long> {

    // Находит запись о верификации по номеру телефона и коду.
    Optional<PhoneVerification> findByPhoneAndCode(String phone, String code);

    // Удаляет запись о верификации по номеру телефона.
    @Transactional
    @Modifying
    void deleteByPhone(String phone);
}
