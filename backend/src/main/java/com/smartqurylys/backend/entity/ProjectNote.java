package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// Сущность для представления заметок (памяток) проекта.
@Entity
@Table(name = "project_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор заметки.

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project; // Проект, к которому относится заметка.

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author; // Автор заметки.

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // Содержимое заметки.

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt; // Дата и время создания заметки.
}
