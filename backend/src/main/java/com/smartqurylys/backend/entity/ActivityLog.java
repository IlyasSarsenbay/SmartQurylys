package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.ActivityActionType;
import com.smartqurylys.backend.shared.enums.ActivityEntityType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Сущность для хранения записей журнала активности.
@Entity
@Table(name = "activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Access(AccessType.FIELD)
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор записи.

    @Column(nullable = false)
    private LocalDateTime timestamp; // Время выполнения действия.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor; // Пользователь, совершивший действие.

    @Column(nullable = false)
    private String actorFullName; // Полное имя пользователя.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityActionType actionType; // Тип действия (например, CREATE, UPDATE).

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityEntityType entityType; // Тип сущности, над которой совершено действие (например, PROJECT, TASK).

    @Column(nullable = false)
    private Long entityId; // Идентификатор сущности.

    @Column(nullable = false)
    private String entityName; // Название сущности.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project; // Проект, к которому относится активность.
}