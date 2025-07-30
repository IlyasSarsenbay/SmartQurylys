package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.ActivityLogResponse;
import com.smartqurylys.backend.service.ActivityLogService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/activity-log")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<List<ActivityLogResponse>> getProjectActivityLog(@PathVariable Long projectId) {
        try {
            List<ActivityLogResponse> logs = activityLogService.getActivitiesForProject(projectId);
            return ResponseEntity.ok(logs);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}