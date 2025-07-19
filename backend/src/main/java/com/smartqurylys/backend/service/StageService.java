package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.stage.CreateStageRequest;
import com.smartqurylys.backend.dto.project.stage.StageResponse;
import com.smartqurylys.backend.dto.project.stage.UpdateStageRequest;
import com.smartqurylys.backend.entity.Schedule;
import com.smartqurylys.backend.entity.Stage;
import com.smartqurylys.backend.repository.ScheduleRepository;
import com.smartqurylys.backend.repository.StageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StageService {
    private final StageRepository stageRepository;
    private final ScheduleRepository scheduleRepository;

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
                .resources(request.getResources())
                .status(request.getStatus())
                .build();

        return mapToResponse(stageRepository.save(stage));
    }

    public List<StageResponse> getStages(Long scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("ГПР не найден"));

        return stageRepository.findBySchedule(schedule).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public StageResponse getStage(Long scheduleId, Long id) {
        scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("ГПР не найден"));

        Stage stage = stageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Этап не найден"));

        return mapToResponse(stage);
    }

    public StageResponse updateStage(Long id, UpdateStageRequest request) {
        Stage stage = stageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Этап не найден"));

        stage.setName(request.getName());
        stage.setDescription(request.getDescription());
        stage.setStartDate(request.getStartDate());
        stage.setEndDate(request.getEndDate());
        stage.setContractors(request.getContractors());
        stage.setResources(request.getResources());
        stage.setStatus(request.getStatus());

        return mapToResponse(stageRepository.save(stage));
    }

    public void deleteStage(Long id) {
        if (!stageRepository.existsById(id)) {
            throw new IllegalArgumentException("Этап не найден");
        }
        stageRepository.deleteById(id);
    }

    private StageResponse mapToResponse(Stage stage) {
        StageResponse response = new StageResponse();
        response.setId(stage.getId());
        response.setName(stage.getName());
        response.setDescription(stage.getDescription());
        response.setStartDate(stage.getStartDate());
        response.setEndDate(stage.getEndDate());
        response.setContractors(stage.getContractors());
        response.setResources(stage.getResources());
        response.setStatus(stage.getStatus());
        return response;
    }
}