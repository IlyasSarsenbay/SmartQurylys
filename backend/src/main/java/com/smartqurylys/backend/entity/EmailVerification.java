package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// Сущность для хранения кодов подтверждения электронной почты.
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор записи.

    @Column(nullable = false, unique = true)
    private String email; // Адрес электронной почты.

    private String code; // Код подтверждения.

    private LocalDateTime expirationTime; // Время истечения срока действия кода.
}