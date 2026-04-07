package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.dto.project.participant.ParticipantResponse;
import com.smartqurylys.backend.dto.project.task.*;
import com.smartqurylys.backend.entity.*;
import com.smartqurylys.backend.repository.*;
import com.smartqurylys.backend.shared.enums.ActivityActionType;
import com.smartqurylys.backend.shared.enums.ActivityEntityType;
import com.smartqurylys.backend.shared.enums.ProjectStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

// Сервис для управления задачами в рамках этапов проекта, включая создание, обновление, удаление, управление зависимостями, требованиями и файлами.
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final StageRepository stageRepository;
    private final ProjectRepository projectRepository;
    private final ParticipantRepository participantRepository;
    private final RequirementRepository requirementRepository;
    private final FileService fileService;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // Преобразует сущность Requirement в DTO RequirementResponse.
    private RequirementResponse mapToRequirementResponse(Requirement requirement) {
        FileResponse sampleFileResponse = null;
        if (requirement.getSampleFile() != null) {
            sampleFileResponse = FileService.mapToFileResponse(requirement.getSampleFile());
        }
        return RequirementResponse.builder()
                .id(requirement.getId())
                .description(requirement.getDescription())
                .sampleFile(sampleFileResponse)
                .build();
    }

    // Преобразует сущность Participant в DTO ParticipantResponse.
    private ParticipantResponse mapToParticipantResponse(Participant participant) {
        return ParticipantResponse.builder()
                .id(participant.getId())
                .fullName(participant.getUser().getFullName())
                .iinBin(participant.getUser().getIinBin())
                .organization(participant.getUser().getOrganization())
                .phone(participant.getUser().getPhone())
                .email(participant.getUser().getEmail())
                .role(participant.getRole())
                .canUploadDocuments(participant.isCanUploadDocuments())
                .canSendNotifications(participant.isCanSendNotifications())
                .build();
    }

    // Создает новую задачу в рамках указанного этапа.
    @Transactional
    public TaskResponse createTask(CreateTaskRequest request, List<MultipartFile> requirementSampleFiles)
            throws IOException {
        Set<Participant> responsiblePersons = new HashSet<>();

        if (request.getResponsiblePersonIds() != null && !request.getResponsiblePersonIds().isEmpty()) {
            List<Participant> foundParticipants = participantRepository
                    .findParticipantsByProjectId(request.getProjectId());

            responsiblePersons = new HashSet<>(foundParticipants);
            
            Set<Long> participantIds = foundParticipants.stream()
                    .map(p -> p.getUser().getId())
                    .collect(Collectors.toSet());

            Set<Long> requestedIds = new HashSet<>(request.getResponsiblePersonIds());

            System.out.println("[DEBUG] participants: " + participantIds);
            System.out.println("[DEBUG] request: " + requestedIds);

            if (!requestedIds.equals(participantIds)) {
                System.out.println("[ERROR] Mismatch in responsible persons");
                throw new IllegalArgumentException("Один или несколько ответственных лиц не найдены в проекте");
            }
        } else {
            System.out.println("[DEBUG] No responsiblePersonIds provided in request");
        }

        Stage stage = null;
        if (request.getStageId() != null) {
            stage = stageRepository.findById(request.getStageId()).orElse(null);
        }

        Task task = Task.builder()
                .stage(stage)
                .projectId(request.getProjectId())
                .name(request.getName())
                .info(request.getInfo())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .responsiblePersons(responsiblePersons)
                .isPriority(request.isPriority())
                .executionRequested(false)
                .executed(false)
                .build();

        Task savedTask = taskRepository.save(task);

        List<Requirement> requirements = new ArrayList<>();
        Map<String, MultipartFile> fileMap = requirementSampleFiles != null ? requirementSampleFiles.stream()
                .collect(Collectors.toMap(
                        MultipartFile::getOriginalFilename,
                        file -> file,
                        (existing, replacement) -> existing))
                : Collections.emptyMap();

        // Создаем требования и связываем их с файлами, если они есть.
        if (request.getRequirements() != null && !request.getRequirements().isEmpty()) {
            for (CreateRequirementRequest reqDto : request.getRequirements()) {
                Requirement requirement = Requirement.builder()
                        .description(reqDto.getDescription())
                        .task(savedTask)
                        .build();

                if (reqDto.getTempFileId() != null && fileMap.containsKey(reqDto.getTempFileId())) {
                    MultipartFile sampleFile = fileMap.get(reqDto.getTempFileId());
                    if (sampleFile != null && !sampleFile.isEmpty()) {
                        File savedSampleFile = fileService.prepareFile(sampleFile, getAuthenticatedUser());
                        requirement.setSampleFile(savedSampleFile);
                    }
                }
                requirements.add(requirement);
            }
            requirementRepository.saveAll(requirements);
            savedTask.setRequirements(requirements);
        } else {
            savedTask.setRequirements(new ArrayList<>());
        }

        return mapToResponse(savedTask);
    }

    // Получает информацию о задаче по ее ID.
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));
        return mapToResponse(task);
    }

    // Получает список всех задач для указанного этапа.
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByStage(Long stageId) {
        Stage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new EntityNotFoundException("Этап не найден с ID: " + stageId));

        return taskRepository.findByStageWithFullDetails(stage).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Получает все задачи Проекта
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден с ID: " + projectId));

        return taskRepository.findTasksByProjectId(project.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public int getTasksCount(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден с ID: " + projectId));

        return taskRepository.findTasksByProjectId(project.getId()).size();
    }

    // Обновляет информацию о существующей задаче.
    @Transactional
    public TaskResponse updateTask(Long taskId, UpdateTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Project project = task.getStage().getSchedule().getProject();
        ProjectStatus status = project.getStatus();
        if (status == ProjectStatus.ON_PAUSE || status == ProjectStatus.COMPLETED
                || status == ProjectStatus.CANCELLED) {
            throw new AccessDeniedException("Изменение задач запрещено в текущем статусе проекта: " + status);
        }

        Optional.ofNullable(request.getName()).ifPresent(task::setName);
        Optional.ofNullable(request.getInfo()).ifPresent(task::setInfo);
        Optional.ofNullable(request.getDescription()).ifPresent(task::setDescription);
        Optional.ofNullable(request.getStartDate()).ifPresent(task::setStartDate);
        Optional.ofNullable(request.getEndDate()).ifPresent(task::setEndDate);
        Optional.ofNullable(request.getProjectId()).ifPresent(task::setProjectId);

        // Обновление ответственных лиц, с проверкой существования.
        if (request.getResponsiblePersonIds() != null) {
            Set<Participant> newResponsiblePersons = new HashSet<>(
                    participantRepository.findAllById(request.getResponsiblePersonIds()));
            if (newResponsiblePersons.size() != request.getResponsiblePersonIds().size()) {
                throw new IllegalArgumentException("Один или несколько ответственных лиц не найдены.");
            }
            task.setResponsiblePersons(newResponsiblePersons);
        }

        Optional.ofNullable(request.getIsPriority()).ifPresent(task::setPriority);

        Task updatedTask = taskRepository.save(task);
        return mapToResponse(updatedTask);
    }

    // Удаляет задачу по ее ID.
    @Transactional
    public void deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Project project = task.getStage().getSchedule().getProject();
        ProjectStatus status = project.getStatus();
        if (status == ProjectStatus.ON_PAUSE || status == ProjectStatus.COMPLETED
                || status == ProjectStatus.CANCELLED) {
            throw new AccessDeniedException("Удаление задач запрещено в текущем статусе проекта: " + status);
        }

        // Удаляем все зависимости, где эта задача является зависимой.
        removeAllDependenciesForTask(taskId);

        // Удаляем все зависимости, где эта задача является основной.
        removeAllDependenciesFromTask(taskId);

        taskRepository.deleteById(taskId);
    }

    // Удаляет все зависимости, где указанная задача является зависимой (другие
    // задачи зависят от этой).
    @Transactional
    public void removeAllDependenciesForTask(Long taskId) {
        List<Task> tasksThatDependOnThis = taskRepository.findTasksThatDependOn(taskId);
        for (Task dependentTask : tasksThatDependOnThis) {
            dependentTask.getDependsOn().removeIf(dep -> dep.getId().equals(taskId));
            taskRepository.save(dependentTask);
        }
    }

    // Удаляет все зависимости, которые текущая задача имеет (от других задач).
    @Transactional
    public void removeAllDependenciesFromTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        if (task.getDependsOn() != null) {
            task.getDependsOn().clear();
            taskRepository.save(task);
        }
    }

    // Помечает задачу как приоритетную.
    @Transactional
    public void togglePriority(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Project project = task.getStage().getSchedule().getProject();
        ProjectStatus status = project.getStatus();
        if (status == ProjectStatus.ON_PAUSE || status == ProjectStatus.COMPLETED
                || status == ProjectStatus.CANCELLED) {
            throw new AccessDeniedException(
                    "Изменение приоритета задач запрещено в текущем статусе проекта: " + status);
        }

        task.setPriority(!task.isPriority());
        taskRepository.save(task);
    }

    // Запрашивает выполнение задачи. Проверяет зависимости.
    @Transactional
    public void requestExecution(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Project project = task.getStage().getSchedule().getProject();
        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new AccessDeniedException(
                    "Запрос исполнения возможен только в активном проекте. Текущий статус: " + project.getStatus());
        }

        if (task.getDependsOn() != null) {
            for (Task dependency : task.getDependsOn()) {
                if (!dependency.isExecuted()) {
                    throw new IllegalStateException(
                            "Нельзя запросить исполнение, пока не завершена зависимая задача: " + dependency.getName());
                }
            }
        }
        activityLogService.recordActivity(
                task.getStage().getSchedule().getProject().getId(),
                ActivityActionType.REQUEST_ACCEPTANCE,
                ActivityEntityType.PROJECT,
                task.getId(),
                task.getName());

        task.setExecutionRequested(true);
        task.setExecutionRequestedAt(LocalDateTime.now());
        taskRepository.save(task);
    }

    // Подтверждает выполнение задачи с необязательной причиной.
    @Transactional
    public TaskResponse confirmExecution(Long taskId, String reason) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Project project = task.getStage().getSchedule().getProject();
        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new AccessDeniedException(
                    "Подтверждение исполнения возможно только в активном проекте. Текущий статус: "
                            + project.getStatus());
        }

        task.setExecuted(true);
        task.setPriority(false);
        task.setExecutionRequestedAt(null);
        taskRepository.save(task);

        User owner = task.getStage().getSchedule().getProject().getOwner();
        activityLogService.recordActivity(
                task.getStage().getSchedule().getProject().getId(),
                ActivityActionType.ACCEPTED_ACCEPTANCE,
                ActivityEntityType.PROJECT,
                task.getId(),
                task.getName());

        // Оповещаем каждого ответственного участника
        if (task.getResponsiblePersons() != null) {
            for (Participant participant : task.getResponsiblePersons()) {
                notificationService.createTaskExecutionNotification(
                        participant.getUser(),
                        owner,
                        task.getStage().getSchedule().getProject(),
                        task.getId(),
                        task.getName(),
                        com.smartqurylys.backend.entity.NotificationType.TASK_ACCEPTED,
                        reason);
            }
        }

        return mapToResponse(task);
    }

    // Отклоняет выполнение задачи с необязательной причиной.
    @Transactional
    public TaskResponse declineExecution(Long taskId, String reason) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Project project = task.getStage().getSchedule().getProject();
        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new AccessDeniedException(
                    "Отклонение исполнения возможно только в активном проекте. Текущий статус: " + project.getStatus());
        }

        task.setExecuted(false);
        task.setExecutionRequested(false);
        task.setExecutionRequestedAt(null);
        taskRepository.save(task);

        User owner = task.getStage().getSchedule().getProject().getOwner();
        activityLogService.recordActivity(
                task.getStage().getSchedule().getProject().getId(),
                ActivityActionType.REJECTED_ACCEPTANCE,
                ActivityEntityType.PROJECT,
                task.getId(),
                task.getName());

        // Оповещаем каждого ответственного участника
        if (task.getResponsiblePersons() != null) {
            for (Participant participant : task.getResponsiblePersons()) {
                notificationService.createTaskExecutionNotification(
                        participant.getUser(),
                        owner,
                        task.getStage().getSchedule().getProject(),
                        task.getId(),
                        task.getName(),
                        com.smartqurylys.backend.entity.NotificationType.TASK_DECLINED,
                        reason);
            }
        }

        return mapToResponse(task);
    }

    // Возвращает задачу в работу из состояния "выполнена".
    @Transactional
    public TaskResponse returnToExecution(Long taskId, String reason) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Project project = task.getStage().getSchedule().getProject();
        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new AccessDeniedException(
                    "Возврат задачи в работу возможен только в активном проекте. Текущий статус: "
                            + project.getStatus());
        }

        task.setExecuted(false);
        task.setExecutionRequested(false);
        task.setExecutionRequestedAt(null);
        taskRepository.save(task);

        User owner = task.getStage().getSchedule().getProject().getOwner();
        activityLogService.recordActivity(
                task.getStage().getSchedule().getProject().getId(),
                ActivityActionType.REJECTED_ACCEPTANCE,
                ActivityEntityType.PROJECT,
                task.getId(),
                task.getName());

        // Оповещаем каждого ответственного участника
        if (task.getResponsiblePersons() != null) {
            for (Participant participant : task.getResponsiblePersons()) {
                notificationService.createTaskExecutionNotification(
                        participant.getUser(),
                        owner,
                        task.getStage().getSchedule().getProject(),
                        task.getId(),
                        task.getName(),
                        com.smartqurylys.backend.entity.NotificationType.TASK_RETURNED,
                        reason);
            }
        }

        return mapToResponse(task);
    }

    // Добавляет файл к задаче.
    @Transactional
    public FileResponse addFileToTask(Long taskId, MultipartFile file) throws IOException {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Project project = task.getStage().getSchedule().getProject();
        ProjectStatus status = project.getStatus();
        if (status == ProjectStatus.ON_PAUSE || status == ProjectStatus.COMPLETED
                || status == ProjectStatus.CANCELLED) {
            throw new AccessDeniedException("Добавление файлов запрещено в текущем статусе проекта: " + status);
        }

        User currentUser = getAuthenticatedUser();
        File savedFile = fileService.prepareFile(file, currentUser);

        if (task.getFiles() == null) {
            task.setFiles(new ArrayList<>());
        }

        task.getFiles().add(savedFile);
        taskRepository.save(task);
        return FileService.mapToFileResponse(savedFile);
    }

    // Получает список файлов, связанных с задачей.
    @Transactional(readOnly = true)
    public List<FileResponse> getFilesByTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        return task.getFiles().stream()
                .map(FileService::mapToFileResponse)
                .collect(Collectors.toList());
    }

    // Добавляет зависимость между задачами.
    @Transactional
    public void addDependency(Long taskId, Long dependencyTaskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Task dependency = taskRepository.findById(dependencyTaskId)
                .orElseThrow(
                        () -> new EntityNotFoundException("Зависимая задача не найдена с ID: " + dependencyTaskId));

        if (task.equals(dependency)) {
            throw new IllegalArgumentException("Задача не может зависеть от самой себя");
        }

        if (task.getDependsOn() == null) {
            task.setDependsOn(new ArrayList<>());
        }

        if (task.getDependsOn().contains(dependency)) {
            throw new IllegalArgumentException("Зависимость уже существует");
        }

        task.getDependsOn().add(dependency);
        taskRepository.save(task);
    }

    // Удаляет зависимость между задачами.
    @Transactional
    public void removeDependency(Long taskId, Long dependencyTaskId) {
        // Проверяем существование задач.
        if (!taskRepository.existsById(taskId)) {
            throw new EntityNotFoundException("Задача не найдена с ID: " + taskId);
        }
        if (!taskRepository.existsById(dependencyTaskId)) {
            throw new EntityNotFoundException("Зависимая задача не найдена с ID: " + dependencyTaskId);
        }

        // Удаляем связь через нативный SQL-запрос.
        int deletedCount = taskRepository.removeDependencyRelation(taskId, dependencyTaskId);

        if (deletedCount == 0) {
            throw new IllegalArgumentException("Зависимость не существует между задачами");
        }

        System.out.println("Удалена " + deletedCount + " зависимость(ей)");
    }

    // Создает новое требование для задачи.
    @Transactional
    public RequirementResponse createRequirement(Long taskId, CreateRequirementRequest request,
            MultipartFile sampleFile) throws IOException {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Requirement requirement = Requirement.builder()
                .description(request.getDescription())
                .task(task)
                .build();

        if (sampleFile != null && !sampleFile.isEmpty()) {
            File savedSampleFile = fileService.prepareFile(sampleFile, getAuthenticatedUser());
            requirement.setSampleFile(savedSampleFile);
        }

        Requirement savedRequirement = requirementRepository.save(requirement);

        if (task.getRequirements() == null) {
            task.setRequirements(new ArrayList<>());
        }
        task.getRequirements().add(savedRequirement);
        taskRepository.save(task);

        return mapToRequirementResponse(savedRequirement);
    }

    // Обновляет существующее требование.
    @Transactional
    public RequirementResponse updateRequirement(Long requirementId, UpdateRequirementRequest request,
            MultipartFile newSampleFile) throws IOException {
        Requirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new EntityNotFoundException("Требование не найдено с ID: " + requirementId));

        Optional.ofNullable(request.getDescription()).ifPresent(requirement::setDescription);

        if (Boolean.TRUE.equals(request.getRemoveSampleFile())) {
            if (requirement.getSampleFile() != null) {
                fileService.deleteFile(requirement.getSampleFile().getId());
                requirement.setSampleFile(null);
            }
        }

        if (newSampleFile != null && !newSampleFile.isEmpty()) {
            if (requirement.getSampleFile() != null) {
                fileService.deleteFile(requirement.getSampleFile().getId());
            }
            File savedFile = fileService.prepareFile(newSampleFile, getAuthenticatedUser());
            requirement.setSampleFile(savedFile);
        }

        Requirement updatedRequirement = requirementRepository.save(requirement);
        return mapToRequirementResponse(updatedRequirement);
    }

    // Удаляет требование.
    @Transactional
    public void deleteRequirement(Long requirementId) throws IOException {
        Requirement requirementToDelete = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new EntityNotFoundException("Requirement not found with ID: " + requirementId));

        if (requirementToDelete.getSampleFile() != null) {
            fileService.deleteFile(requirementToDelete.getSampleFile().getId());
        }

        if (requirementToDelete.getTask() != null) {
            Task task = requirementToDelete.getTask();
            task.getRequirements().remove(requirementToDelete);
            taskRepository.save(task);
        }

        requirementRepository.delete(requirementToDelete);
    }

    // Получает список всех требований для указанной задачи.
    @Transactional(readOnly = true)
    public List<RequirementResponse> getRequirementsByTaskId(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));
        return task.getRequirements().stream()
                .map(this::mapToRequirementResponse)
                .collect(Collectors.toList());
    }

    // Вспомогательный метод для получения аутентифицированного пользователя.
    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = (principal instanceof UserDetails userDetails)
                ? userDetails.getUsername()
                : principal.toString();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));
    }

    // Преобразует сущность Task в DTO TaskResponse.
    private TaskResponse mapToResponse(Task task) {
        List<ParticipantResponse> responsiblePersons = task.getResponsiblePersons() != null
                ? task.getResponsiblePersons().stream()
                        .map(this::mapToParticipantResponse)
                        .collect(Collectors.toList())
                : new ArrayList<>();

        List<RequirementResponse> requirements = task.getRequirements() != null ? task.getRequirements().stream()
                .map(this::mapToRequirementResponse)
                .collect(Collectors.toList()) : new ArrayList<>();

        List<FileResponse> files = task.getFiles() != null ? task.getFiles().stream()
                .map(FileService::mapToFileResponse)
                .toList() : new ArrayList<>();

        List<Long> dependsOnTaskIds = task.getDependsOn() != null ? task.getDependsOn().stream()
                .map(Task::getId)
                .collect(Collectors.toList()) : new ArrayList<>();

        return TaskResponse.builder()
                .id(task.getId())
                .name(task.getName())
                .description(task.getDescription())
                .info(task.getInfo())
                .responsiblePersons(responsiblePersons)
                .startDate(task.getStartDate())
                .endDate(task.getEndDate())
                .isPriority(task.isPriority())
                .executionRequested(task.isExecutionRequested())
                .executionRequestedAt(task.getExecutionRequestedAt())
                .executionConfirmed(task.isExecuted())
                .dependsOnTaskIds(dependsOnTaskIds)
                .requirements(requirements)
                .build();
    }
}
