package com.smartqurylys.backend.dto.user.organisation;

import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LicenseUpdateRequest {
    private String name;
    private String licenseCategoryDisplay;
    private FileReviewStatus reviewStatus;
}