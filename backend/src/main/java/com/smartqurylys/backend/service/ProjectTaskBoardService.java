package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.taskboard.*;
import com.smartqurylys.backend.entity.*;
import com.smartqurylys.backend.repository.*;
import com.smartqurylys.backend.shared.enums.ProjectTaskBoardPriority;
import com.smartqurylys.backend.shared.enums.ProjectTaskBoardStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectTaskBoardService {

    private final ProjectRepository projectRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final ProjectTaskBoardStageRepository stageRepository;
    private final ProjectTaskBoardTaskRepository taskRepository;
    private final ProjectTaskCommentRepository commentRepository;

    @Transactional(readOnly = true)
    public ProjectTaskBoardResponse getBoard(Long projectId) {
        Project project = requireProjectAccess(projectId);
        List<ProjectTaskBoardStage> stages = stageRepository.findByProjectIdOrderByPositionAscIdAsc(projectId);
        List<ProjectTaskBoardTask> tasks = taskRepository.findBoardTasksByProjectId(projectId);
        Map<Long, Long> commentCounts = loadCommentCounts(projectId);

        return ProjectTaskBoardResponse.builder()
                .projectId(project.getId())
                .stages(buildStageResponses(stages, tasks, commentCounts))
                .build();
    }

    @Transactional
    public ProjectTaskBoardStageResponse createStage(Long projectId, CreateProjectTaskBoardStageRequest request) {
        Project project = requireProjectAccess(projectId);
        LocalDateTime now = LocalDateTime.now();

        ProjectTaskBoardStage stage = ProjectTaskBoardStage.builder()
                .project(project)
                .name(request.getName().trim())
                .position(stageRepository.findByProjectIdOrderByPositionAscIdAsc(projectId).size())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return mapStageResponse(stageRepository.save(stage), List.of(), Map.of());
    }

    @Transactional
    public ProjectTaskBoardStageResponse updateStage(
            Long projectId,
            Long stageId,
            UpdateProjectTaskBoardStageRequest request
    ) {
        requireProjectAccess(projectId);
        ProjectTaskBoardStage stage = getStageOrThrow(projectId, stageId);

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            stage.setName(request.getName().trim());
        }
        if (request.getPosition() != null) {
            stage.setPosition(Math.max(0, request.getPosition()));
        }
        stage.setUpdatedAt(LocalDateTime.now());

        ProjectTaskBoardStage savedStage = stageRepository.save(stage);
        List<ProjectTaskBoardTask> stageTasks = taskRepository.findBoardTasksByProjectId(projectId).stream()
                .filter(task -> Objects.equals(task.getStage().getId(), savedStage.getId()))
                .toList();

        return mapStageResponse(savedStage, stageTasks, loadCommentCounts(projectId));
    }

    @Transactional
    public void deleteStage(Long projectId, Long stageId) {
        requireProjectAccess(projectId);
        stageRepository.delete(getStageOrThrow(projectId, stageId));
    }

    @Transactional
    public ProjectTaskBoardTaskResponse createTask(Long projectId, CreateProjectTaskBoardTaskRequest request) {
        Project project = requireProjectAccess(projectId);
        ProjectTaskBoardStage stage = getStageOrThrow(projectId, request.getStageId());
        ProjectTaskBoardTask parentTask = resolveParentTask(projectId, request.getParentTaskId(), stage.getId());
        LocalDateTime now = LocalDateTime.now();

        ProjectTaskBoardTask task = ProjectTaskBoardTask.builder()
                .project(project)
                .stage(stage)
                .parentTask(parentTask)
                .title(request.getTitle().trim())
                .description(null)
                .status(ProjectTaskBoardStatus.TODO)
                .priority(ProjectTaskBoardPriority.MEDIUM)
                .dueDate(null)
                .assigneeParticipant(null)
                .position(resolveNextTaskPosition(stage.getId(), parentTask))
                .createdBy(getAuthenticatedUser())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return mapTaskResponse(taskRepository.save(task), Map.of(), Collections.emptyMap());
    }

    @Transactional
    public ProjectTaskBoardTaskResponse updateTask(
            Long projectId,
            Long taskId,
            UpdateProjectTaskBoardTaskRequest request
    ) {
        requireProjectAccess(projectId);
        ProjectTaskBoardTask task = getTaskOrThrow(projectId, taskId);

        if (request.getStageId() != null && !Objects.equals(request.getStageId(), task.getStage().getId())) {
            ProjectTaskBoardStage nextStage = getStageOrThrow(projectId, request.getStageId());
            task.setStage(nextStage);
            if (task.getParentTask() != null && !Objects.equals(task.getParentTask().getStage().getId(), nextStage.getId())) {
                task.setParentTask(null);
            }
        }

        if (Boolean.TRUE.equals(request.getClearParentTask())) {
            task.setParentTask(null);
        } else if (request.getParentTaskId() != null) {
            ProjectTaskBoardTask parentTask = resolveParentTask(projectId, request.getParentTaskId(), task.getStage().getId());
            if (Objects.equals(parentTask.getId(), task.getId())) {
                throw new IllegalArgumentException("Task cannot be its own parent");
            }
            task.setParentTask(parentTask);
        }

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            task.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            task.setDescription(normalizeBlank(request.getDescription()));
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (Boolean.TRUE.equals(request.getClearDueDate())) {
            task.setDueDate(null);
        } else if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (Boolean.TRUE.equals(request.getClearAssignee())) {
            task.setAssigneeParticipant(null);
        } else if (request.getAssigneeParticipantId() != null) {
            task.setAssigneeParticipant(resolveAssignee(projectId, request.getAssigneeParticipantId()));
        }
        if (request.getPosition() != null) {
            task.setPosition(Math.max(0, request.getPosition()));
        }

        task.setUpdatedAt(LocalDateTime.now());

        return mapTaskResponse(taskRepository.save(task), loadCommentCounts(projectId), Collections.emptyMap());
    }

    @Transactional
    public void deleteTask(Long projectId, Long taskId) {
        requireProjectAccess(projectId);
        taskRepository.delete(getTaskOrThrow(projectId, taskId));
    }

    @Transactional
    public void bulkDeleteTasks(Long projectId, BulkDeleteProjectTaskBoardTasksRequest request) {
        requireProjectAccess(projectId);
        List<ProjectTaskBoardTask> tasks = taskRepository.findByIdInAndProjectId(request.getTaskIds(), projectId);
        if (tasks.size() != request.getTaskIds().size()) {
            throw new EntityNotFoundException("One or more board tasks were not found");
        }
        taskRepository.deleteAll(tasks);
    }

    @Transactional(readOnly = true)
    public List<ProjectTaskCommentResponse> getComments(Long projectId, Long taskId) {
        requireProjectAccess(projectId);
        getTaskOrThrow(projectId, taskId);
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(this::mapCommentResponse)
                .toList();
    }

    @Transactional
    public ProjectTaskCommentResponse addComment(
            Long projectId,
            Long taskId,
            CreateProjectTaskCommentRequest request
    ) {
        requireProjectAccess(projectId);
        ProjectTaskBoardTask task = getTaskOrThrow(projectId, taskId);
        LocalDateTime now = LocalDateTime.now();

        ProjectTaskComment comment = ProjectTaskComment.builder()
                .task(task)
                .author(getAuthenticatedUser())
                .message(request.getMessage().trim())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return mapCommentResponse(commentRepository.save(comment));
    }

    private List<ProjectTaskBoardStageResponse> buildStageResponses(
            List<ProjectTaskBoardStage> stages,
            List<ProjectTaskBoardTask> tasks,
            Map<Long, Long> commentCounts
    ) {
        Map<Long, List<ProjectTaskBoardTask>> tasksByStage = tasks.stream()
                .collect(Collectors.groupingBy(task -> task.getStage().getId(), LinkedHashMap::new, Collectors.toList()));

        return stages.stream()
                .map(stage -> mapStageResponse(stage, tasksByStage.getOrDefault(stage.getId(), List.of()), commentCounts))
                .toList();
    }

    private ProjectTaskBoardStageResponse mapStageResponse(
            ProjectTaskBoardStage stage,
            List<ProjectTaskBoardTask> stageTasks,
            Map<Long, Long> commentCounts
    ) {
        Map<Long, List<ProjectTaskBoardTask>> childrenByParentId = stageTasks.stream()
                .filter(task -> task.getParentTask() != null)
                .collect(Collectors.groupingBy(task -> task.getParentTask().getId(), LinkedHashMap::new, Collectors.toList()));

        List<ProjectTaskBoardTaskResponse> rootTasks = stageTasks.stream()
                .filter(task -> task.getParentTask() == null)
                .sorted(Comparator.comparing(ProjectTaskBoardTask::getPosition).thenComparing(ProjectTaskBoardTask::getId))
                .map(task -> mapTaskResponse(task, commentCounts, childrenByParentId))
                .toList();

        return ProjectTaskBoardStageResponse.builder()
                .id(stage.getId())
                .name(stage.getName())
                .position(stage.getPosition())
                .taskCount(stageTasks.size())
                .tasks(rootTasks)
                .build();
    }

    private ProjectTaskBoardTaskResponse mapTaskResponse(
            ProjectTaskBoardTask task,
            Map<Long, Long> commentCounts,
            Map<Long, List<ProjectTaskBoardTask>> childrenByParentId
    ) {
        List<ProjectTaskBoardTaskResponse> subtasks = childrenByParentId.getOrDefault(task.getId(), List.of()).stream()
                .sorted(Comparator.comparing(ProjectTaskBoardTask::getPosition).thenComparing(ProjectTaskBoardTask::getId))
                .map(child -> mapTaskResponse(child, commentCounts, childrenByParentId))
                .toList();

        return ProjectTaskBoardTaskResponse.builder()
                .id(task.getId())
                .stageId(task.getStage().getId())
                .parentTaskId(task.getParentTask() != null ? task.getParentTask().getId() : null)
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .position(task.getPosition())
                .assignee(mapAssignee(task.getAssigneeParticipant()))
                .createdBy(mapUserSummary(task.getCreatedBy()))
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .commentCount(commentCounts.getOrDefault(task.getId(), 0L))
                .subtasks(subtasks)
                .build();
    }

    private Map<Long, Long> loadCommentCounts(Long projectId) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : commentRepository.countCommentsByProjectId(projectId)) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    private ProjectTaskBoardStage getStageOrThrow(Long projectId, Long stageId) {
        return stageRepository.findByIdAndProjectId(stageId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("Board stage not found"));
    }

    private ProjectTaskBoardTask getTaskOrThrow(Long projectId, Long taskId) {
        return taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("Board task not found"));
    }

    private ProjectTaskBoardTask resolveParentTask(Long projectId, Long parentTaskId, Long stageId) {
        if (parentTaskId == null) {
            return null;
        }

        ProjectTaskBoardTask parentTask = getTaskOrThrow(projectId, parentTaskId);
        if (!Objects.equals(parentTask.getStage().getId(), stageId)) {
            throw new IllegalArgumentException("Parent task must belong to the same stage");
        }
        if (parentTask.getParentTask() != null) {
            throw new IllegalArgumentException("Only root tasks can have subtasks");
        }
        return parentTask;
    }

    private Participant resolveAssignee(Long projectId, Long participantId) {
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new EntityNotFoundException("Participant not found"));
        if (!Objects.equals(participant.getProject().getId(), projectId)) {
            throw new IllegalArgumentException("Participant does not belong to the project");
        }
        return participant;
    }

    private int resolveNextTaskPosition(Long stageId, ProjectTaskBoardTask parentTask) {
        if (parentTask == null) {
            return (int) taskRepository.countByStageIdAndParentTaskIsNull(stageId);
        }
        return (int) taskRepository.countByParentTaskId(parentTask.getId());
    }

    private ProjectTaskBoardAssigneeResponse mapAssignee(Participant participant) {
        if (participant == null) {
            return null;
        }
        return ProjectTaskBoardAssigneeResponse.builder()
                .participantId(participant.getId())
                .userId(participant.getUser().getId())
                .fullName(participant.getUser().getFullName())
                .role(participant.getRole())
                .build();
    }

    private ProjectTaskBoardUserSummaryResponse mapUserSummary(User user) {
        if (user == null) {
            return null;
        }
        return ProjectTaskBoardUserSummaryResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .build();
    }

    private ProjectTaskCommentResponse mapCommentResponse(ProjectTaskComment comment) {
        return ProjectTaskCommentResponse.builder()
                .id(comment.getId())
                .taskId(comment.getTask().getId())
                .message(comment.getMessage())
                .author(mapUserSummary(comment.getAuthor()))
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private String normalizeBlank(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private Project requireProjectAccess(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found"));

        User currentUser = getAuthenticatedUser();
        boolean isOwner = Objects.equals(project.getOwner().getId(), currentUser.getId());
        boolean isParticipant = participantRepository.existsByProjectAndUser(project, currentUser);
        boolean isAdmin = "ADMIN".equals(currentUser.getRole());

        if (!isOwner && !isParticipant && !isAdmin) {
            throw new AccessDeniedException("You do not have access to this project board");
        }

        return project;
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = principal instanceof UserDetails userDetails
                ? userDetails.getUsername()
                : principal.toString();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }
}
