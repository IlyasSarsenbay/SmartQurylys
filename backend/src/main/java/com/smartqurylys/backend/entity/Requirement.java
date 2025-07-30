package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "requirements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Requirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String description;

     @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
     @JoinColumn(name = "sample_file_id")
     private File sampleFile;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "task_id", nullable = false)
     private Task task;
}