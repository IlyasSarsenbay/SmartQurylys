package com.smartqurylys.backend.entity;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

// Сущность для представления лицензии, наследует от File.
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

    private String licenseCategoryDisplay; // Отображаемое название категории лицензии.

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private FileReviewStatus reviewStatus; // Статус проверки лицензии.
    
    @Column(length = 500)
    private String rejectionReason; // Причина отклонения лицензии администратором.
}