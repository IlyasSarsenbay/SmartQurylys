package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

// Сущность для представления сметы, наследует от Document.
@Entity
@Table(name = "estimates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@PrimaryKeyJoinColumn(name = "id")
public class Estimate extends Document {

//    private boolean includeNDS;

    private float overheadsAmount; // Сумма накладных расходов.
    private float reserveAmount; // Сумма резервных средств.
    private float transportAmount; // Сумма транспортных расходов.

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "estimate_id")
    private List<EstimateItem> items; // Список пунктов сметы.
}
