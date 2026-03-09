package com.smartqurylys.backend.dto.project;

import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// Обьект передачи данных для ответа с информацией о документе представителя.
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class RepresentativeDocumentResponse extends FileResponse {
    private FileReviewStatus reviewStatus;
    private String rejectionReason;
}
