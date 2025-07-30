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

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserService userService;
    private final ProjectRepository projectRepository;

    @Transactional
    public void recordActivity(Long projectId, ActivityActionType actionType,
                               ActivityEntityType entityType, Long entityId,
                               String entityName) {
        User actor = userService.getCurrentUserEntity();

        String actorFullNameToLog;
        if (actor instanceof Organisation organisation) {
            actorFullNameToLog = organisation.getOrganization();
        } else {
            actorFullNameToLog = actor.getFullName();
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

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getActivitiesForProject(Long projectId) {
        List<ActivityLog> logs = activityLogRepository.findByProjectIdOrderByTimestampDesc(projectId);
        return logs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

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