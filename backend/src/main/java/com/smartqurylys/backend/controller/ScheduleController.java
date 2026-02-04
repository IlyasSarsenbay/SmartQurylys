package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.CreateScheduleRequest;
import com.smartqurylys.backend.dto.project.ScheduleResponse;
import com.smartqurylys.backend.dto.project.UpdateScheduleRequest;
import com.smartqurylys.backend.entity.File;
import com.smartqurylys.backend.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

// Контроллер для управления графиками работ по проекту.
@RestController
@RequestMapping("/api/projects/{projectId}/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    // Создание нового графика работ.
    @PostMapping
    public ResponseEntity<ScheduleResponse> createSchedule(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateScheduleRequest request
    ) {
        return ResponseEntity.ok(scheduleService.createSchedule(projectId, request));
    }

    // Получение графика работ по проекту.
    @GetMapping
    public ResponseEntity<List<ScheduleResponse>> getSchedule(@PathVariable Long projectId) {
        return ResponseEntity.ok(scheduleService.getSchedulesByProject(projectId));
    }

    // Обновление графика работ.
    @PutMapping
    public ResponseEntity<ScheduleResponse> updateSchedule(
            @PathVariable Long projectId,
            @Valid @RequestBody UpdateScheduleRequest request
    ) {
        return ResponseEntity.ok(scheduleService.updateSchedule(projectId, request));
    }

    // Удаление графика работ.
    @DeleteMapping
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable Long projectId
    ) {
        scheduleService.deleteSchedule(projectId);
        return ResponseEntity.noContent().build();
    }

    // Загрузка файла в график работ.
    @PostMapping("/files")
    public ResponseEntity<Void> uploadScheduleFile(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        scheduleService.addFileToScedule(projectId, file);
        return ResponseEntity.ok().build();
    }

    // Получение списка файлов графика работ.
    @GetMapping("/files")
    public ResponseEntity<List<File>> getScheduleFiles(@PathVariable Long projectId) {
        return ResponseEntity.ok( scheduleService.getFilesBySchedule(projectId));
    }
}
