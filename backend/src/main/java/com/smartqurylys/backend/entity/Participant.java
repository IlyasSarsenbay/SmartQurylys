package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

// Сущность для представления участника проекта.
@Entity
@Table(name = "participants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор участника.

    private String role; // Роль участника в проекте.

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // Пользователь, связанный с этим участником.

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project; // Проект, в котором участвует пользователь.

    private boolean canUploadDocuments; // Право на загрузку документов.

    private boolean canSendNotifications; // Право на отправку уведомлений.
}