package com.smartqurylys.backend.dto.project;


import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// Объект передачи данных для ответа с информацией о лицензии, наследует от FileResponse.
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LicenseResponse extends FileResponse {
    private String licenseCategoryDisplay; // Отображаемое название категории лицензии.
    private FileReviewStatus reviewStatus; // Статус проверки файла лицензии.
    private String rejectionReason; // Причина отклонения лицензии.
}