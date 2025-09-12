package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.ActivityActionType;
import com.smartqurylys.backend.shared.enums.ActivityEntityType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Column(nullable = false)
    private String actorFullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityEntityType entityType;

    @Column(nullable = false)
    private Long entityId;

    @Column(nullable = false)
    private String entityName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
}