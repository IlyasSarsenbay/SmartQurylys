package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// Сущность для представления уведомлений пользователей системы.
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор уведомления.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient; // Получатель уведомления.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = true)
    private User sender; // Отправитель уведомления (может быть null для системных уведомлений).

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project; // Проект, к которому относится уведомление.

    @Column(nullable = false)
    private String message; // Текст уведомления.

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("isRead")
    private boolean isRead = false; // Флаг прочтения уведомления.

    @Column(nullable = false)
    private LocalDateTime createdAt; // Дата и время создания уведомления.

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private NotificationType type; // Тип уведомления.

    private Long relatedEntityId; // Идентификатор связанной сущности (приглашение, задача, этап и т.д.).
}
