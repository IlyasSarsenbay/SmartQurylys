package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.StageStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

// Сущность для представления этапа в графике работ.
@Entity
@Table(name = "stages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор этапа.

    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private Schedule schedule; // График работ, к которому относится этап.

    private String name; // Название этапа.

    private String description; // Описание этапа.

    private LocalDate startDate; // Дата начала этапа.

    private LocalDate endDate; // Дата окончания этапа.

    private String contractors; // Подрядчики, ответственные за выполнение этапа.

//    private String resources;

    @Enumerated(EnumType.STRING)
    private StageStatus status; // Текущий статус этапа.

    @OneToMany(mappedBy = "stage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks; // Список задач, входящих в этот этап.
}
