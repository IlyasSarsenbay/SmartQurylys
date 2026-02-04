package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.ProjectStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Сущность для представления проекта.
@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор проекта.

    private String name; // Название проекта.

    private String description; // Описание проекта.

    private String type; // Тип проекта.

    private LocalDate startDate; // Дата начала проекта.

    private LocalDate endDate; // Дата окончания проекта.

    @Enumerated(EnumType.STRING)
    private ProjectStatus status; // Текущий статус проекта.

    @ManyToOne
    @JoinColumn(name = "city_id")
    private City city; // Город, в котором реализуется проект.

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Participant> participants = new ArrayList<>(); // Участники проекта.

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ParticipantInvitation> invitations; // Приглашения в проект.

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    private List<Document> documents; // Документы, связанные с проектом.

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "project_id")
    private List<File> files; // Файлы, относящиеся к проекту.

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User owner; // Владелец проекта.

    @OneToOne(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private Schedule schedule; // График работ по проекту.

    @OneToOne(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private Conversation projectChat; // Чат проекта.

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ActivityLog> activityLogs = new ArrayList<>(); // Журнал активности по проекту.
}

