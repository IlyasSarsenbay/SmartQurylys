package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.document.EstimateItemDto;
import com.smartqurylys.backend.dto.project.document.EstimateRequest;
import com.smartqurylys.backend.dto.project.document.EstimateResponse;
import com.smartqurylys.backend.entity.*;
import com.smartqurylys.backend.repository.EstimateRepository;
import com.smartqurylys.backend.repository.ProjectRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.stream.Collectors;

// Сервис для управления сметами проектов.
@Service
@RequiredArgsConstructor
public class EstimateService {

    private final EstimateRepository estimateRepository;
    private final ProjectRepository projectRepository;

    // Создает новую смету или обновляет существующую для проекта.
    public EstimateResponse createOrUpdateEstimate(Long projectId, EstimateRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        Estimate estimate = estimateRepository.findByProject(project).orElse(
                Estimate.builder().project(project).items(new ArrayList<>()).build()
        );

        estimate.setName(request.getName());
//        estimate.setIncludeNDS(request.isIncludeNDS());
        estimate.setOverheadsAmount(request.getOverheadsAmount());
        estimate.setReserveAmount(request.getReserveAmount());
        estimate.setTransportAmount(request.getTransportAmount());

        Estimate saved = estimateRepository.save(estimate);
        return mapToResponse(saved);
    }

    // Получает смету для указанного проекта.
    public EstimateResponse getEstimateByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        Estimate estimate = estimateRepository.findByProject(project)
                .orElseThrow(() -> new IllegalArgumentException("Смета не найдена"));

        return mapToResponse(estimate);
    }

    // Удаляет смету для указанного проекта.
    @Transactional
    public void deleteEstimate(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        Estimate estimate = estimateRepository.findByProject(project)
                .orElseThrow(() -> new IllegalArgumentException("Смета не найдена"));

        estimateRepository.delete(estimate);
    }

    // Добавляет новый пункт в смету проекта.
    @Transactional
    public void addEstimateItem(Long projectId, EstimateItemDto dto) {
        Estimate estimate = getEstimateEntity(projectId);

        EstimateItem item = EstimateItem.builder()
                .name(dto.getName())
                .unit(dto.getUnit())
                .unitPrice(dto.getUnitPrice())
                .quantity(dto.getQuantity())
                .build();

        estimate.getItems().add(item);
        estimateRepository.save(estimate);
    }

    // Удаляет пункт из сметы проекта.
    @Transactional
    public void deleteEstimateItem(Long projectId, Long itemId) {
        Estimate estimate = getEstimateEntity(projectId);

        boolean removed = estimate.getItems().removeIf(item -> item.getId().equals(itemId));
        if (!removed) {
            throw new IllegalArgumentException("Элемент сметы не найден");
        }

        estimateRepository.save(estimate);
    }

    // Вспомогательный метод для получения сущности сметы по ID проекта.
    private Estimate getEstimateEntity(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        return estimateRepository.findByProject(project)
                .orElseThrow(() -> new IllegalArgumentException("Смета не найдена"));
    }

    // Вычисляет общую стоимость сметы, включая накладные, резерв, транспорт и НДС.
    private float calculateTotal(Estimate estimate) {
        float total = estimate.getItems().stream()
                .map(i -> i.getUnitPrice() * i.getQuantity())
                .reduce(0f, Float::sum);

        // Предполагается, что НДС 12% применяется после всех надбавок.
        total = (total + estimate.getOverheadsAmount() + estimate.getReserveAmount() + estimate.getTransportAmount())*1.12f;

        return total;
    }

    // Вычисляет общую стоимость сметы без учета НДС.
    private float calculateTotalWithoutNDS(Estimate estimate) {
        return calculateTotal(estimate) / 1.12f; // Пример: НДС 12%
    }

    // Обновляет сумму накладных расходов в смете.
    @Transactional
    public void updateOverheads(Long projectId, float amount) {
        Estimate estimate = getEstimateEntity(projectId);
        estimate.setOverheadsAmount(amount);
        estimateRepository.save(estimate);
    }

    // Обновляет сумму резервных средств в смете.
    @Transactional
    public void updateReserve(Long projectId, float amount) {
        Estimate estimate = getEstimateEntity(projectId);
        estimate.setReserveAmount(amount);
        estimateRepository.save(estimate);
    }

    // Обновляет сумму транспортных расходов в смете.
    @Transactional
    public void updateTransport(Long projectId, float amount) {
        Estimate estimate = getEstimateEntity(projectId);
        estimate.setTransportAmount(amount);
        estimateRepository.save(estimate);
    }

    // Преобразует сущность Estimate в DTO EstimateResponse.
    private EstimateResponse mapToResponse(Estimate estimate) {
        return EstimateResponse.builder()
                .id((long) estimate.getId())
                .name(estimate.getName())
//                .includeNDS(estimate.isIncludeNDS())
                .totalCost(calculateTotal(estimate))
                .totalCostWithoutNDS(calculateTotalWithoutNDS(estimate))
                .items(estimate.getItems().stream().map(item -> EstimateItemDto.builder()
                        .id(item.getId())
                        .name(item.getName())
                        .unit(item.getUnit())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .totalCost(item.getTotalCost())
                        .build()).collect(Collectors.toList()))
                .build();
    }
}

