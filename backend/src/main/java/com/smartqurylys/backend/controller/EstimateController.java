package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.document.EstimateItemDto;
import com.smartqurylys.backend.dto.project.document.EstimateRequest;
import com.smartqurylys.backend.dto.project.document.EstimateResponse;
import com.smartqurylys.backend.service.EstimateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Контроллер для управления сметой проекта.
@RestController
@RequestMapping("/api/projects/{projectId}/estimate")
@RequiredArgsConstructor
public class EstimateController {

    private final EstimateService estimateService;

    // Получение сметы для проекта.
    @GetMapping
    public ResponseEntity<EstimateResponse> getEstimate(@PathVariable Long projectId) {
        return ResponseEntity.ok(estimateService.getEstimateByProject(projectId));
    }

    // Создание или обновление сметы.
    @PostMapping
    public ResponseEntity<EstimateResponse> createOrUpdateEstimate(
            @PathVariable Long projectId,
            @Valid @RequestBody EstimateRequest request
    ) {
        return ResponseEntity.ok(estimateService.createOrUpdateEstimate(projectId, request));
    }

    // Удаление сметы.
    @DeleteMapping
    public ResponseEntity<Void> deleteEstimate(@PathVariable Long projectId) {
        estimateService.deleteEstimate(projectId);
        return ResponseEntity.noContent().build();
    }

    // Добавление пункта в смету.
    @PostMapping("/items")
    public ResponseEntity<Void> addEstimateItem(
            @PathVariable Long projectId,
            @Valid @RequestBody EstimateItemDto itemDto
    ) {
        estimateService.addEstimateItem(projectId, itemDto);
        return ResponseEntity.ok().build();
    }

    // Удаление пункта из сметы.
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteEstimateItem(
            @PathVariable Long projectId,
            @PathVariable Long itemId
    ) {
        estimateService.deleteEstimateItem(projectId, itemId);
        return ResponseEntity.noContent().build();
    }

    // Обновление накладных расходов.
    @PutMapping("/overheads")
    public ResponseEntity<Void> setOverheads(
            @PathVariable Long projectId,
            @RequestParam float amount
    ) {
        estimateService.updateOverheads(projectId, amount);
        return ResponseEntity.ok().build();
    }

    // Обновление резервных средств.
    @PutMapping("/reserve")
    public ResponseEntity<Void> setReserve(
            @PathVariable Long projectId,
            @RequestParam float amount
    ) {
        estimateService.updateReserve(projectId, amount);
        return ResponseEntity.ok().build();
    }

    // Обновление транспортных расходов.
    @PutMapping("/transport")
    public ResponseEntity<Void> setTransport(
            @PathVariable Long projectId,
            @RequestParam float amount
    ) {
        estimateService.updateTransport(projectId, amount);
        return ResponseEntity.ok().build();
    }
}

