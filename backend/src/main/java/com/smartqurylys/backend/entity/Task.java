package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

// Сущность для представления задачи в рамках этапа.
@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор задачи.

    @ManyToOne
    @JoinColumn(name = "stage_id")
    private Stage stage; // Этап, к которому относится задача.

    private String name; // Название задачи.

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "task_responsible_persons",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "participant_id")
    )
    private Set<Participant> responsiblePersons; // Ответственные за задачу.

    private LocalDate startDate; // Дата начала задачи.

    private LocalDate endDate; // Дата окончания задачи.

    private String info; // Дополнительная информация о задаче.

    private String description; // Описание задачи.

    @com.fasterxml.jackson.annotation.JsonProperty("isPriority")
    private boolean isPriority; // Флаг, указывающий на приоритетность задачи.

    private boolean executionRequested; // Флаг запроса на выполнение задачи.

    private boolean executed; // Флаг, указывающий, выполнена ли задача.

    @ManyToMany
    @JoinTable(
            name = "task_dependencies",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "depends_on_task_id")
    )
    private List<Task> dependsOn; // Список задач, от которых зависит текущая.

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "task_id")
    private List<File> files; // Файлы, прикрепленные к задаче.

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Requirement> requirements; // Требования к задаче.
}