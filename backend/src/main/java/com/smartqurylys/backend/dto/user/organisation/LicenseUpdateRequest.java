package com.smartqurylys.backend.dto.user.organisation;

import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// Объект передачи данных для запроса на обновление информации о лицензии.
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LicenseUpdateRequest {
    private String name; // Новое название лицензии.
    private String licenseCategoryDisplay; // Новое отображаемое название категории лицензии.
    private FileReviewStatus reviewStatus; // Новый статус проверки лицензии.
    private String rejectionReason; // Причина отклонения лицензии.
}