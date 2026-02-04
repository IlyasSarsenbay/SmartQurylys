package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// Сущность для хранения кодов подтверждения номера телефона.
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhoneVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор записи.

    private String phone; // Номер телефона.

    private String code; // Код подтверждения.

    private LocalDateTime expirationTime; // Время истечения срока действия кода.
}