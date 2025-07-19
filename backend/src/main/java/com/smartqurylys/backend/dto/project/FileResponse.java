package com.smartqurylys.backend.dto.project;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FileResponse {
    private Long id;
    private String name;
    private String filepath;
    private Long size;
    private LocalDateTime createdAt;
    private String creatorIinBin;
}