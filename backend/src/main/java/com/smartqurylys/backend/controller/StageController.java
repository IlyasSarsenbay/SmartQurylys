package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.stage.CreateStageRequest;
import com.smartqurylys.backend.dto.project.stage.StageResponse;
import com.smartqurylys.backend.dto.project.stage.UpdateStageRequest;
import com.smartqurylys.backend.dto.stage.ReturnToActiveRequest;
import com.smartqurylys.backend.service.StageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Контроллер для управления этапами графика работ.
@RestController
@RequestMapping("/api/schedules/{scheduleId}/stages")
@RequiredArgsConstructor
public class StageController {

    private final StageService stageService;

    // Создание нового этапа в графике.
    @PostMapping
    public ResponseEntity<StageResponse> createStage(
            @PathVariable Long scheduleId,
            @Valid @RequestBody CreateStageRequest request
    ) {
        return ResponseEntity.ok(stageService.createStage(scheduleId, request));
    }

    // Получение всех этапов графика.
    @GetMapping
    public ResponseEntity<List<StageResponse>> getStages(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(stageService.getStages(scheduleId));
    }

    // Получение этапа по ID.
    @GetMapping("/{id}")
    public ResponseEntity<StageResponse> getProjectById(@PathVariable Long scheduleId, @PathVariable Long id) {
        return ResponseEntity.ok(stageService.getStage(scheduleId, id));
    }

    // Обновление данных этапа.
    @PutMapping("/{stageId}")
    public ResponseEntity<StageResponse> updateStage(
            @PathVariable Long stageId,
            @Valid @RequestBody UpdateStageRequest request
    ) {
        return ResponseEntity.ok(stageService.updateStage(stageId, request));
    }

    // Удаление этапа.
    @DeleteMapping("/{stageId}")
    public ResponseEntity<Void> deleteStage(@PathVariable Long stageId) {
        stageService.deleteStage(stageId);
        return ResponseEntity.noContent().build();
    }

    // Завершение этапа.
    @PutMapping("/{stageId}/complete")
    public ResponseEntity<StageResponse> completeStage(@PathVariable Long stageId) {
        return ResponseEntity.ok(stageService.completeStage(stageId));
    }

    // Возврат этапа в активное состояние.
    @PutMapping("/{stageId}/return-to-active")
    public ResponseEntity<StageResponse> returnStageToActive(
            @PathVariable Long stageId,
            @RequestBody ReturnToActiveRequest request) {
        return ResponseEntity.ok(stageService.returnStageToActive(stageId, request.getReason()));
    }
}
