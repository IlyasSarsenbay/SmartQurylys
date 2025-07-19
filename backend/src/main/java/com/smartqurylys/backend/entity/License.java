package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "licenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@PrimaryKeyJoinColumn(name = "id")
@DiscriminatorValue("LICENSE")
public class License extends File {

    private String licenseCategoryDisplay;

    @Enumerated(EnumType.STRING)
    private FileReviewStatus reviewStatus;
}