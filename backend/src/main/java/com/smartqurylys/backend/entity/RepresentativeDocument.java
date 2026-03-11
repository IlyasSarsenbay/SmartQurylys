package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

// Сущность для представления документа представителя, наследует от File.
@Entity
@Table(name = "representative_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@PrimaryKeyJoinColumn(name = "id")
@DiscriminatorValue("REPRESENTATIVE_DOCUMENT")
public class RepresentativeDocument extends File {

    @Enumerated(EnumType.STRING)
    private FileReviewStatus reviewStatus; // Статус проверки документа.

    @Column(length = 500)
    private String rejectionReason; // Причина отклонения документа администратором.
}
