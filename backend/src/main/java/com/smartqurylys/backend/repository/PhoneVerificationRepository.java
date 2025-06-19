package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.PhoneVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface PhoneVerificationRepository extends JpaRepository<PhoneVerification, Long> {

    Optional<PhoneVerification> findByPhoneAndCode(String phone, String code);

    @Transactional
    @Modifying
    void deleteByPhone(String phone);
}
