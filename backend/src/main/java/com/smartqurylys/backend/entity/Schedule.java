package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

// Сущность для представления графика работ по проекту.
@Entity
@Table(name = "schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор графика работ.

    private String name; // Название графика работ.

    @OneToOne
    @JoinColumn(name = "project_id")
    private Project project; // Проект, к которому относится график.

    private LocalDateTime createdAt; // Дата и время создания графика.

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Stage> stages; // Список этапов, входящих в график.

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "schedule_id")
    private List<File> files; // Файлы, связанные с графиком работ.
}
