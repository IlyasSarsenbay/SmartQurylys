package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

// Сущность для представления города.
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "cities")
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор города.

    @Column(nullable = false, unique = true)
    private String name; // Название города.
}
