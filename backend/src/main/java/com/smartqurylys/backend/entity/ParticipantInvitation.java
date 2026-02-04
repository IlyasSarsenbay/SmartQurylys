package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// Сущность для хранения приглашений участников в проект.
@Entity
@Table(name = "participant_invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор приглашения.

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // Пользователь, которому отправлено приглашение.

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender; // Пользователь, который отправил приглашение.

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project; // Проект, в который приглашают.

    private String role; // Предлагаемая роль в проекте.

    private boolean canUploadDocuments; // Права на загрузку документов.

    private boolean canSendNotifications; // Права на отправку уведомлений.

    private boolean accepted; // Статус принятия приглашения.

    private LocalDateTime createdAt; // Дата и время создания приглашения.

    private LocalDateTime expiresAt; // Дата и время истечения срока действия приглашения.
}
