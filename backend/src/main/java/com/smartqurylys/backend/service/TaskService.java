package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.dto.project.participant.ParticipantResponse;
import com.smartqurylys.backend.dto.project.task.*;
import com.smartqurylys.backend.entity.*;
import com.smartqurylys.backend.repository.*;
import com.smartqurylys.backend.shared.enums.ActivityActionType;
import com.smartqurylys.backend.shared.enums.ActivityEntityType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final StageRepository stageRepository;
    private final ParticipantRepository participantRepository;
    private final RequirementRepository requirementRepository;
    private final FileService fileService;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;


    private RequirementResponse mapToRequirementResponse(Requirement requirement) {
        FileResponse sampleFileResponse = null;
        if (requirement.getSampleFile() != null) {
            sampleFileResponse = fileService.mapToFileResponse(requirement.getSampleFile());
        }
        return RequirementResponse.builder()
                .id(requirement.getId())
                .description(requirement.getDescription())
                .sampleFile(sampleFileResponse)
                .build();
    }


    private ParticipantResponse mapToParticipantResponse(Participant participant) {
        return ParticipantResponse.builder()
                .id(participant.getId())
                .fullName(participant.getUser().getFullName())
                .iinBin(participant.getUser().getIinBin())
                .role(participant.getRole())
                .canUploadDocuments(participant.isCanUploadDocuments())
                .canSendNotifications(participant.isCanSendNotifications())
                .build();
    }

    @Transactional
    public TaskResponse createTask(Long stageId, CreateTaskRequest request, List<MultipartFile> requirementSampleFiles) throws IOException {
        Stage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new EntityNotFoundException("Этап не найден с ID: " + stageId));

        Set<Participant> responsiblePersons = new HashSet<>();
        if (request.getResponsiblePersonIds() != null && !request.getResponsiblePersonIds().isEmpty()) {
            System.out.println("[DEBUG] Received responsiblePersonIds: " + request.getResponsiblePersonIds());

            List<Participant> foundParticipants = participantRepository.findAllById(request.getResponsiblePersonIds());
            System.out.println("[DEBUG] Found participants in DB: " + foundParticipants.stream()
                    .map(p -> p.getId() + ":" + (p.getUser() != null ? p.getUser().getFullName() : "null"))
                    .collect(Collectors.toList()));

            responsiblePersons = new HashSet<>(foundParticipants);
            System.out.println("[DEBUG] Responsible persons set size: " + responsiblePersons.size() +
                    ", requested size: " + request.getResponsiblePersonIds().size());

            if (responsiblePersons.size() != request.getResponsiblePersonIds().size()) {
                System.out.println("[ERROR] Mismatch in responsible persons count. Expected: " +
                        request.getResponsiblePersonIds().size() + ", found: " + responsiblePersons.size());
                throw new IllegalArgumentException("Один или несколько ответственных лиц не найдены.");
            }
        } else {
            System.out.println("[DEBUG] No responsiblePersonIds provided in request");
        }
        Task task = Task.builder()
                .stage(stage)
                .name(request.getName())
                .info(request.getInfo())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .responsiblePersons(responsiblePersons)
                .isPriority(false)
                .executionRequested(false)
                .executed(false)
                .build();

        Task savedTask = taskRepository.save(task);

        List<Requirement> requirements = new ArrayList<>();
        Map<String, MultipartFile> fileMap = requirementSampleFiles != null ?
                requirementSampleFiles.stream()
                        .collect(Collectors.toMap(
                                MultipartFile::getOriginalFilename,
                                file -> file,
                                (existing, replacement) -> existing
                        )) :
                Collections.emptyMap();


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


    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));
        return mapToResponse(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByStage(Long stageId) {
        Stage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new EntityNotFoundException("Этап не найден с ID: " + stageId));

        return taskRepository.findByStageWithFullDetails(stage).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse updateTask(Long taskId, UpdateTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Optional.ofNullable(request.getName()).ifPresent(task::setName);
        Optional.ofNullable(request.getInfo()).ifPresent(task::setInfo);
        Optional.ofNullable(request.getDescription()).ifPresent(task::setDescription);
        Optional.ofNullable(request.getStartDate()).ifPresent(task::setStartDate);
        Optional.ofNullable(request.getEndDate()).ifPresent(task::setEndDate);

        // Обновление ответственных лиц
        if (request.getResponsiblePersonIds() != null) {
            Set<Participant> newResponsiblePersons = new HashSet<>(participantRepository.findAllById(request.getResponsiblePersonIds()));
            if (newResponsiblePersons.size() != request.getResponsiblePersonIds().size()) {
                throw new IllegalArgumentException("Один или несколько ответственных лиц не найдены.");
            }
            task.setResponsiblePersons(newResponsiblePersons);
        }

        Task updatedTask = taskRepository.save(task);
        return mapToResponse(updatedTask);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new EntityNotFoundException("Задача не найдена с ID: " + taskId);
        }
        // 1. Удаляем все зависимости, где эта задача является зависимой
        removeAllDependenciesForTask(taskId);

        // 2. Удаляем все зависимости, где эта задача является основной
        removeAllDependenciesFromTask(taskId);
        
        taskRepository.deleteById(taskId);
    }

    @Transactional
    public void removeAllDependenciesForTask(Long taskId) {
        // Удаляем все зависимости, где эта задача является зависимой (другие задачи зависят от этой)
        List<Task> tasksThatDependOnThis = taskRepository.findTasksThatDependOn(taskId);
        for (Task dependentTask : tasksThatDependOnThis) {
            dependentTask.getDependsOn().removeIf(dep -> dep.getId().equals(taskId));
            taskRepository.save(dependentTask);
        }
    }

    @Transactional
    public void removeAllDependenciesFromTask(Long taskId) {
        // Удаляем все зависимости этой задачи (задачи, от которых зависит эта задача)
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        if (task.getDependsOn() != null) {
            task.getDependsOn().clear();
            taskRepository.save(task);
        }
    }

    @Transactional
    public void markAsPriority(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));
        task.setPriority(true);
        taskRepository.save(task);
    }

    @Transactional
    public void requestExecution(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        if (task.getDependsOn() != null) {
            for (Task dependency : task.getDependsOn()) {
                if (!dependency.isExecuted()) {
                    throw new IllegalStateException("Нельзя запросить исполнение, пока не завершена зависимая задача: " + dependency.getName());
                }
            }
        }
        activityLogService.recordActivity(
                task.getStage().getSchedule().getProject().getId(),
                ActivityActionType.REQUEST_ACCEPTANCE,
                ActivityEntityType.PROJECT,
                task.getId(),
                task.getName()
        );

        task.setExecutionRequested(true);
        taskRepository.save(task);
    }

    @Transactional
    public TaskResponse confirmExecution(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));
        task.setExecuted(true);
        taskRepository.save(task);

        activityLogService.recordActivity(
                task.getStage().getSchedule().getProject().getId(),
                ActivityActionType.ACCEPTED_ACCEPTANCE,
                ActivityEntityType.PROJECT,
                task.getId(),
                task.getName()
        );

        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse declineExecution(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));
        task.setExecuted(false);
        task.setExecutionRequested(false);
        taskRepository.save(task);
        System.out.println("project id: " + task.getStage().getSchedule().getId());
        activityLogService.recordActivity(
                task.getStage().getSchedule().getProject().getId(),
                ActivityActionType.REJECTED_ACCEPTANCE,
                ActivityEntityType.PROJECT,
                task.getId(),
                task.getName()
        );

        return mapToResponse(task);
    }


    @Transactional
    public FileResponse addFileToTask(Long taskId, MultipartFile file) throws IOException {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        User currentUser = getAuthenticatedUser();
        File savedFile = fileService.prepareFile(file, currentUser);

        if (task.getFiles() == null) {
            task.setFiles(new ArrayList<>());
        }

        task.getFiles().add(savedFile);
        taskRepository.save(task);
        return fileService.mapToFileResponse(savedFile);
    }

    @Transactional(readOnly = true)
    public List<FileResponse> getFilesByTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        return task.getFiles().stream()
                .map(fileService::mapToFileResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void addDependency(Long taskId, Long dependencyTaskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));

        Task dependency = taskRepository.findById(dependencyTaskId)
                .orElseThrow(() -> new EntityNotFoundException("Зависимая задача не найдена с ID: " + dependencyTaskId));

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

    @Transactional
    public void removeDependency(Long taskId, Long dependencyTaskId) {
        // Проверяем существование задач
        if (!taskRepository.existsById(taskId)) {
            throw new EntityNotFoundException("Задача не найдена с ID: " + taskId);
        }
        if (!taskRepository.existsById(dependencyTaskId)) {
            throw new EntityNotFoundException("Зависимая задача не найдена с ID: " + dependencyTaskId);
        }

        // Удаляем связь через native query
        int deletedCount = taskRepository.removeDependencyRelation(taskId, dependencyTaskId);

        if (deletedCount == 0) {
            throw new IllegalArgumentException("Зависимость не существует между задачами");
        }

        System.out.println("Удалена " + deletedCount + " зависимость(ей)");
    }

    @Transactional
    public RequirementResponse createRequirement(Long taskId, CreateRequirementRequest request, MultipartFile sampleFile) throws IOException {
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

    @Transactional
    public RequirementResponse updateRequirement(Long requirementId, UpdateRequirementRequest request, MultipartFile newSampleFile) throws IOException {
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

    @Transactional(readOnly = true)
    public List<RequirementResponse> getRequirementsByTaskId(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена с ID: " + taskId));
        return task.getRequirements().stream()
                .map(this::mapToRequirementResponse)
                .collect(Collectors.toList());
    }


    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = (principal instanceof UserDetails userDetails)
                ? userDetails.getUsername()
                : principal.toString();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));
    }


    private TaskResponse mapToResponse(Task task) {

        List<ParticipantResponse> responsiblePersons = task.getResponsiblePersons() != null ?
                task.getResponsiblePersons().stream()
                        .map(this::mapToParticipantResponse)
                        .collect(Collectors.toList()) :
                new ArrayList<>();



        List<RequirementResponse> requirements = task.getRequirements() != null ?
                task.getRequirements().stream()
                        .map(this::mapToRequirementResponse)
                        .collect(Collectors.toList()) :
                new ArrayList<>();

        List<FileResponse> files = task.getFiles() != null ?
                task.getFiles().stream()
                        .map(fileService::mapToFileResponse)
                        .toList() :
                new ArrayList<>();

        List<Long> dependsOnTaskIds = task.getDependsOn() != null ?
                task.getDependsOn().stream()
                        .map(Task::getId)
                        .collect(Collectors.toList()) :
                new ArrayList<>();

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
                .executionConfirmed(task.isExecuted())
                .dependsOnTaskIds(dependsOnTaskIds)
                .requirements(requirements)
                .build();
    }
}
