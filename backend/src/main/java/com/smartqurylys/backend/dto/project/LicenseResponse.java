package com.smartqurylys.backend.dto.project;


import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LicenseResponse extends FileResponse {
    private String licenseCategoryDisplay;
    private FileReviewStatus reviewStatus;
}