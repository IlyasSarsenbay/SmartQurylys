package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.StageStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;


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
    private Long id;

    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    private String name;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private String contractors;

//    private String resources;

    @Enumerated(EnumType.STRING)
    private StageStatus status;

    @OneToMany(mappedBy = "stage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks;

}
