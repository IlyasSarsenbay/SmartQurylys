package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.stage.CreateStageRequest;
import com.smartqurylys.backend.dto.project.stage.StageResponse;
import com.smartqurylys.backend.dto.project.stage.UpdateStageRequest;
import com.smartqurylys.backend.entity.Schedule;
import com.smartqurylys.backend.entity.Stage;
import com.smartqurylys.backend.repository.ScheduleRepository;
import com.smartqurylys.backend.repository.StageRepository;
import com.smartqurylys.backend.shared.enums.StageStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// Сервис для управления этапами в рамках графика работ проекта.
@Service
@RequiredArgsConstructor
public class StageService {
    private final StageRepository stageRepository;
    private final ScheduleRepository scheduleRepository;
    private final NotificationService notificationService;
    private final ParticipantService participantService;

    // Создает новый этап для указанного графика работ.
    public StageResponse createStage(Long scheduleId, CreateStageRequest request) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("ГПР не найден"));

        Stage stage = Stage.builder()
                .schedule(schedule)
                .name(request.getName())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .contractors(request.getContractors())
//                .resources(request.getResources())
                // Первый этап становится активным, остальные ждут.
                .status(schedule.getStages().isEmpty() ? StageStatus.valueOf("ACTIVE") : StageStatus.valueOf("WAITING"))
                .build();

        return mapToResponse(stageRepository.save(stage));
    }

    // Получает все этапы для указанного графика работ.
    public List<StageResponse> getStages(Long scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("ГПР не найден"));

        return stageRepository.findBySchedule(schedule).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Получает конкретный этап по его ID и ID графика работ.
    public StageResponse getStage(Long scheduleId, Long id) {
        scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("ГПР не найден"));

        Stage stage = stageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Этап не найден"));

        return mapToResponse(stage);
    }

    // Обновляет информацию о существующем этапе.
    public StageResponse updateStage(Long id, UpdateStageRequest request) {
        Stage stage = stageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Этап не найден"));

        Optional.ofNullable(request.getName()).ifPresent(stage::setName);
        Optional.ofNullable(request.getDescription()).ifPresent(stage::setDescription);
        Optional.ofNullable(request.getStartDate()).ifPresent(stage::setStartDate);
        Optional.ofNullable(request.getEndDate()).ifPresent(stage::setEndDate);
        Optional.ofNullable(request.getContractors()).ifPresent(stage::setContractors);
        Optional.ofNullable(request.getStatus()).ifPresent(stage::setStatus);

        return mapToResponse(stageRepository.save(stage));
    }

    // Удаляет этап по его ID.
    public void deleteStage(Long id) {
        if (!stageRepository.existsById(id)) {
            throw new IllegalArgumentException("Этап не найден");
        }
        stageRepository.deleteById(id);
    }

    // Завершает текущий этап и активирует следующий, если он есть.
    public StageResponse completeStage(Long id) {
        Stage currentStage = stageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Текущий этап с ID " + id + " не найден"));

        currentStage.setStatus(StageStatus.COMPLETED); // Устанавливаем статус "Завершено".

        List<Stage> allStagesInSchedule = stageRepository.findBySchedule(currentStage.getSchedule());

        // Сортируем этапы, чтобы найти следующий по порядку.
        allStagesInSchedule.sort(Comparator.comparing(Stage::getId));

        int currentStageIndex = -1;
        for (int i = 0; i < allStagesInSchedule.size(); i++) {
            if (allStagesInSchedule.get(i).getId().equals(currentStage.getId())) {
                currentStageIndex = i;
                break;
            }
        }
        int nextStageIndex = currentStageIndex + 1;
        while (nextStageIndex < allStagesInSchedule.size()) {
            Stage nextStage = allStagesInSchedule.get(nextStageIndex);
            if (nextStage.getStatus() != StageStatus.COMPLETED) { // Активируем следующий незавершенный этап.
                nextStage.setStatus(StageStatus.ACTIVE);
                stageRepository.save(nextStage);
                break;
            }
            nextStageIndex++; 
        }

        if (nextStageIndex >= allStagesInSchedule.size()) {
            System.out.println("Все последующие этапы в расписании уже завершены.");
        }

        return mapToResponse(stageRepository.save(currentStage));
    }

    // Возвращает этап в активное состояние с уведомлением участников.
    public StageResponse returnStageToActive(Long id, String reason) {
        Stage stage = stageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Этап не найден"));

        stage.setStatus(StageStatus.ACTIVE);
        Stage savedStage = stageRepository.save(stage);
        
        // Получаем проект через schedule
        Long projectId = stage.getSchedule().getProject().getId();
        
        // Получаем всех участников проекта
        var participants = participantService.getParticipantsEntitiesByProject(projectId);
        
        // Создаем уведомление для каждого участника
        String message = String.format("Этап '%s' возвращен в актив. Причина: %s", 
                stage.getName(), reason);
        
        participants.forEach(participant -> {
            notificationService.createStageReturnNotification(
                participant.getUser(),
                stage.getSchedule().getProject(),
                message,
                stage.getId()
            );
        });
        
        return mapToResponse(savedStage);
    }

    // Преобразует сущность Stage в DTO StageResponse.
    private StageResponse mapToResponse(Stage stage) {
        StageResponse response = new StageResponse();
        response.setId(stage.getId());
        response.setName(stage.getName());
        response.setDescription(stage.getDescription());
        response.setStartDate(stage.getStartDate());
        response.setEndDate(stage.getEndDate());
        response.setContractors(stage.getContractors());
//        response.setResources(stage.getResources());
        response.setStatus(stage.getStatus());
        return response;
    }
}