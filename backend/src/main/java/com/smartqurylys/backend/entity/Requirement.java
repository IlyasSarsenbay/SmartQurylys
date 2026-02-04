package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Сущность для представления требования к задаче.
@Entity
@Table(name = "requirements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Requirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор требования.

    @Column(nullable = false)
    private String description; // Описание требования.

     @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
     @JoinColumn(name = "sample_file_id")
     private File sampleFile; // Файл-образец, связанный с требованием.

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "task_id", nullable = false)
     private Task task; // Задача, к которой относится требование.
}