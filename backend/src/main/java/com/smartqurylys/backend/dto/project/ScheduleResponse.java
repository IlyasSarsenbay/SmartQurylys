package com.smartqurylys.backend.dto.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class ScheduleResponse {
    private Long id;
    private String name;
    private String projectName;
    private LocalDateTime createdAt;
}