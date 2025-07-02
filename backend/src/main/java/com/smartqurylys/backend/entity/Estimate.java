package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

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

    private float overheadsAmount;
    private float reserveAmount;
    private float transportAmount;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "estimate_id")
    private List<EstimateItem> items;
}
