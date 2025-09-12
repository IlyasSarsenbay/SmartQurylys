package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.stage.CreateStageRequest;
import com.smartqurylys.backend.dto.project.stage.StageResponse;
import com.smartqurylys.backend.dto.project.stage.UpdateStageRequest;
import com.smartqurylys.backend.service.StageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules/{scheduleId}/stages")
@RequiredArgsConstructor
public class StageController {

    private final StageService stageService;

    @PostMapping
    public ResponseEntity<StageResponse> createStage(
            @PathVariable Long scheduleId,
            @Valid @RequestBody CreateStageRequest request
    ) {
        return ResponseEntity.ok(stageService.createStage(scheduleId, request));
    }

    @GetMapping
    public ResponseEntity<List<StageResponse>> getStages(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(stageService.getStages(scheduleId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StageResponse> getProjectById(@PathVariable Long scheduleId, @PathVariable Long id) {
        return ResponseEntity.ok(stageService.getStage(scheduleId, id));
    }


    @PutMapping("/{stageId}")
    public ResponseEntity<StageResponse> updateStage(
            @PathVariable Long stageId,
            @Valid @RequestBody UpdateStageRequest request
    ) {
        return ResponseEntity.ok(stageService.updateStage(stageId, request));
    }

    @DeleteMapping("/{stageId}")
    public ResponseEntity<Void> deleteStage(@PathVariable Long stageId) {
        stageService.deleteStage(stageId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{stageId}/complete")
    public ResponseEntity<StageResponse> completeStage(@PathVariable Long stageId) {
        return ResponseEntity.ok(stageService.completeStage(stageId));
    }

    @PutMapping("/{stageId}/return-to-active")
    public ResponseEntity<StageResponse> returnStageToActive(@PathVariable Long stageId) {
        return ResponseEntity.ok(stageService.returnStageToActive(stageId));
    }
}
