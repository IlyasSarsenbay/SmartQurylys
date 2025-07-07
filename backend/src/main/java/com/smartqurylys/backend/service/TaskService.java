package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.task.CreateTaskRequest;
import com.smartqurylys.backend.dto.project.task.TaskResponse;
import com.smartqurylys.backend.dto.project.task.UpdateTaskRequest;
import com.smartqurylys.backend.entity.*;
import com.smartqurylys.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final StageRepository stageRepository;
    private final ParticipantRepository participantRepository;
    private final FileService fileService;
    private final UserRepository userRepository;

    public TaskResponse createTask(Long stageId, CreateTaskRequest request) {
        Stage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new IllegalArgumentException("Этап не найден"));

        Participant responsible = null;
        if (request.getParticipantId() != null) {
            responsible = participantRepository.findById(request.getParticipantId())
                    .orElse(null); 
        }

        Task task = Task.builder()
                .stage(stage)
                .name(request.getName())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .description(request.getDescription())
                .info(request.getInfo())
                .responsiblePerson(responsible)
                .build();

        taskRepository.save(task);
        return mapToResponse(task);
    }

    public List<TaskResponse> getTasksByStage(Long stageId) {
        Stage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new IllegalArgumentException("Этап не найден"));

        return taskRepository.findByStage(stage).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse getTaskById(Long stageId, Long taskId) {
        Stage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new IllegalArgumentException("Этап не найден"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Задача не найдена"));

        if (!task.getStage().getId().equals(stage.getId())) {
            throw new IllegalArgumentException("Задача не принадлежит указанному этапу");
        }

        return mapToResponse(task);
    }

    public TaskResponse updateTask(Long taskId, UpdateTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Задача не найдена"));

        Participant responsible = participantRepository.findById(request.getParticipantId())
                .orElseThrow(() -> new IllegalArgumentException("Ответственный участник не найден"));

        task.setName(request.getName());
        task.setStartDate(request.getStartDate());
        task.setEndDate(request.getEndDate());
        task.setDescription(request.getDescription());
        task.setInfo(request.getInfo());
        task.setResponsiblePerson(responsible);

        taskRepository.save(task);
        return mapToResponse(task);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new IllegalArgumentException("Задача не найдена");
        }
        taskRepository.deleteById(taskId);
    }

    // ✅ Отметить задачу как приоритетную
    public void markAsPriority(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Задача не найдена"));
        task.setPriority(true);
        taskRepository.save(task);
    }

    // ✅ Запросить выполнение задачи
    public void requestExecution(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Задача не найдена"));

        for (Task dependency : task.getDependsOn()) {
            if (!dependency.isExecuted()) {
                throw new IllegalStateException("Нельзя запросить исполнение, пока не завершена первая задача");
            }
        }

        task.setExecutionRequested(true);
        taskRepository.save(task);
    }

    // ✅ Подтвердить выполнение задачи
    public void confirmExecution(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Задача не найдена"));
        task.setExecuted(true);
        taskRepository.save(task);
    }

    public void addFileToTask(Long taskId, MultipartFile file) throws IOException {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Задача не найдена"));

        User currentUser = getAuthenticatedUser();
        File savedFile = fileService.prepareFile(file, currentUser);

        if (task.getFiles() == null) {
            task.setFiles(new ArrayList<>());
        }

        task.getFiles().add(savedFile);
        taskRepository.save(task);
    }

    public List<File> getFilesByTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Задача не найдена"));

        return task.getFiles();
    }

    public void addDependency(Long taskId, Long dependencyTaskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Задача не найдена"));

        Task dependency = taskRepository.findById(dependencyTaskId)
                .orElseThrow(() -> new IllegalArgumentException("Зависимая задача не найдена"));

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

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = (principal instanceof UserDetails userDetails)
                ? userDetails.getUsername()
                : principal.toString();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    private TaskResponse mapToResponse(Task task) {

        String participantName = null;
        if (task.getResponsiblePerson() != null && task.getResponsiblePerson().getUser() != null) {
            participantName = task.getResponsiblePerson().getUser().getFullName();
        }

        return TaskResponse.builder()
                .id(task.getId())
                .name(task.getName())
                .description(task.getDescription())
                .startDate(task.getStartDate())
                .endDate(task.getEndDate())
                .info(task.getInfo())
                .participantName(participantName)
                .isPriority(task.isPriority())
                .executionRequested(task.isExecutionRequested())
                .executionConfirmed(task.isExecuted()) // <-- ключевая замена здесь
                .build();
    }
}
