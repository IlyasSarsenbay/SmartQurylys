package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

// Сущность для представления отдельного пункта в смете.
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstimateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор пункта сметы.

    private String name; // Название пункта.
    private String unit; // Единица измерения.
    private float unitPrice; // Цена за единицу.
    private float quantity; // Количество.

    // Вычисляет общую стоимость данного пункта сметы.
    public float getTotalCost() {
        return unitPrice * quantity;
    }
}

