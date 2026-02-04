package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.ActivityLogResponse;
import com.smartqurylys.backend.entity.ActivityLog;
import com.smartqurylys.backend.entity.Organisation;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.ActivityLogRepository;
import com.smartqurylys.backend.repository.ProjectRepository;
import com.smartqurylys.backend.shared.enums.ActivityActionType;
import com.smartqurylys.backend.shared.enums.ActivityEntityType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

// Сервис для управления журналом активности.
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserService userService;
    private final ProjectRepository projectRepository;
    private final com.smartqurylys.backend.repository.UserRepository userRepository;

    // Записывает действие пользователя в журнал активности.
    @Transactional
    public void recordActivity(Long projectId, ActivityActionType actionType,
                               ActivityEntityType entityType, Long entityId,
                               String entityName) {
        User actor = userService.getCurrentUserEntity();
        // Принудительно загружаем сущность заново, чтобы избежать проблем с прокси и тенями полей (shadowing)
        actor = userRepository.findById(actor.getId()).orElse(actor);

        String actorFullNameToLog = actor.getFullName();

        // Если fullName пуст, пробуем взять organization (Lombok переопределяет геттер для Organisation)
        if (actorFullNameToLog == null || actorFullNameToLog.isBlank()) {
            actorFullNameToLog = actor.getOrganization();
        }

        // Если все еще пусто, используем email как гарантированный непустой вариант
        if (actorFullNameToLog == null || actorFullNameToLog.isBlank()) {
            actorFullNameToLog = actor.getEmail();
        }

        // Страховка на случай непредвиденных обстоятельств
        if (actorFullNameToLog == null || actorFullNameToLog.isBlank()) {
            actorFullNameToLog = "User ID: " + actor.getId();
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден с ID: " + projectId));

        ActivityLog log = ActivityLog.builder()
                .timestamp(LocalDateTime.now())
                .actor(actor)
                .actorFullName(actorFullNameToLog)
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .entityName(entityName)
                .project(project)
                .build();

        activityLogRepository.save(log);
    }

    // Получает все записи журнала активности для указанного проекта.
    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getActivitiesForProject(Long projectId) {
        List<ActivityLog> logs = activityLogRepository.findByProjectIdOrderByTimestampDesc(projectId);
        return logs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Преобразует сущность ActivityLog в DTO ActivityLogResponse.
    private ActivityLogResponse mapToResponse(ActivityLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .timestamp(log.getTimestamp())
                .actorId(log.getActor().getId())
                .actorFullName(log.getActorFullName())
                .actionType(log.getActionType())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .entityName(log.getEntityName())
                .projectId(log.getProject().getId())
                .build();
    }
}