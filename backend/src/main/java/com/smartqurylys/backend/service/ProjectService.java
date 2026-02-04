package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.*;
import com.smartqurylys.backend.entity.*;
import com.smartqurylys.backend.repository.CityRepository;
import com.smartqurylys.backend.repository.ProjectRepository;
import com.smartqurylys.backend.repository.UserRepository;
import com.smartqurylys.backend.shared.enums.ActivityActionType;
import com.smartqurylys.backend.shared.enums.ActivityEntityType;
import com.smartqurylys.backend.shared.enums.ProjectStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// Сервис для управления проектами: создание, получение, обновление, удаление, а также работа с файлами и контроль доступа.
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final FileService fileService;
    private final ActivityLogService activityLogService;
    private final com.smartqurylys.backend.repository.ParticipantRepository participantRepository;
    private final com.smartqurylys.backend.repository.ProjectNoteRepository projectNoteRepository;

    // Создает новый проект. Только организации или администраторы могут создавать проекты.
    public ProjectResponse createProject(CreateProjectRequest request) {
        User owner = getAuthenticatedUser();

        if (!(owner instanceof Organisation) && !"ADMIN".equals(owner.getRole())) {
            throw new AccessDeniedException("Только организации или администраторы могут создавать проекты.");
        }

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Город не найден"));

        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setType(request.getType());
        project.setStatus(ProjectStatus.DRAFT); // Проект изначально находится в черновике.
        project.setOwner(owner);
        project.setCity(city);
        project.setFiles(new ArrayList<>());
        project.setInvitations(new ArrayList<>());

        // Создаем начальный график работ для проекта.
        Schedule schedule = Schedule.builder()
                .name("ГПР")
                .project(project)
                .createdAt(LocalDateTime.now())
                .build();
        project.setSchedule(schedule);

        Project saved = projectRepository.save(project);

        return mapToResponse(saved);
    }

    // Получает список проектов, принадлежащих текущему аутентифицированному пользователю.
    public List<ProjectResponse> getMyProjects() {
        User currentUser = getAuthenticatedUser();

        // Проекты, где пользователь является владельцем
        List<Project> ownedProjects = projectRepository.findByOwner(currentUser);

        // Проекты, где пользователь является участником
        List<Participant> participations = participantRepository.findByUser(currentUser);
        List<Project> participatedProjects = participations.stream()
                .map(Participant::getProject)
                .collect(Collectors.toList());

        // Объединяем и удаляем дубликаты
        Set<Project> allProjects = new java.util.HashSet<>(ownedProjects);
        allProjects.addAll(participatedProjects);

        return allProjects.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Получает информацию о проекте по его ID с проверкой прав доступа.
    public ProjectResponse getProjectById(Long id) {
        System.out.println("Попытка доступа к проекту с ID: " + id);

        Project project = projectRepository.findByIdWithParticipants(id) // Получаем проект с его участниками.
                .orElseThrow(() -> {
                    System.out.println("Проект с ID: " + id + " не найден.");
                    return new IllegalArgumentException("Проект не найден");
                });

        User currentUser = getAuthenticatedUser();
        System.out.println("Текущий аутентифицированный пользователь: ID = " + currentUser.getId() + ", Роль = " + currentUser.getRole());

        boolean isAdmin = "ADMIN".equals(currentUser.getRole());
        boolean isOwner = project.getOwner() != null && project.getOwner().getId().equals(currentUser.getId());
        boolean isParticipant = project.getParticipants() != null &&
                project.getParticipants().stream()
                        .anyMatch(p -> p.getUser().getId().equals(currentUser.getId()));

        System.out.println("Результаты проверки прав доступа:");
        System.out.println("  - Пользователь является администратором (isAdmin): " + isAdmin);
        System.out.println("  - Пользователь является владельцем (isOwner): " + isOwner);
        System.out.println("  - Пользователь является участником (isParticipant): " + isParticipant);

        // Проверяем, имеет ли пользователь права на просмотр проекта.
        if (!isAdmin && !isOwner && !isParticipant) {
            System.out.println("Доступ запрещен для пользователя " + currentUser.getId() + " к проекту " + id);
            throw new AccessDeniedException("Доступ запрещен: У вас нет прав для просмотра этого проекта.");
        }

        System.out.println("Доступ разрешен для пользователя " + currentUser.getId() + " к проекту " + id);
        return mapToResponse(project);
    }

    // Получает список всех проектов (только для администраторов, если включена соответствующая авторизация).
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream().map(this::getProjectResponse).collect(Collectors.toList());
    }

    // Вспомогательный метод для преобразования сущности Project в DTO ProjectResponse.
    private ProjectResponse getProjectResponse(Project project) {
        ScheduleResponse scheduleResponse = null;
        if (project.getSchedule() != null) {
            scheduleResponse = ScheduleResponse.builder()
                    .id(project.getSchedule().getId())
                    .build();
        }

        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getStartDate(),
                project.getEndDate(),
                project.getType(),
                project.getStatus().name(),
                project.getCity().getName(),
                project.getOwner().getIinBin(),
                project.getOwner().getFullName(),
                scheduleResponse
        );
    }

    // Обновляет информацию о проекте.
    public ProjectResponse updateProject(Long id, UpdateProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Город не найден"));

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setType(request.getType());
        project.setStatus(request.getStatus());
        project.setCity(city);

        // Записываем активность об обновлении проекта.
        activityLogService.recordActivity(
                project.getId(),
                ActivityActionType.PROJECT_UPDATED,
                ActivityEntityType.PROJECT,
                project.getId(),
                project.getName()
        );

        Project updated = projectRepository.save(project);
        return mapToResponse(updated);
    }

    // Удаляет проект. Только владелец проекта или администратор могут удалить проект.
    public void deleteProject(Long id) {
        User currentUser = getAuthenticatedUser();

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));
        boolean isAdmin = currentUser.getRole().equals("ADMIN");

        if (!project.getOwner().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new SecurityException("Вы не являетесь владельцем проекта");
        }

        projectRepository.delete(project);
    }

    // Вспомогательный метод для получения аутентифицированного пользователя.
    private User getAuthenticatedUser() {
        String email = getAuthenticatedEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    // Вспомогательный метод для получения email аутентифицированного пользователя.
    private String getAuthenticatedEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        } else {
            return principal.toString();
        }
    }

    // Добавляет файл к проекту.
    public void addFileToProject(Long projectId, MultipartFile file) throws IOException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        User currentUser = getAuthenticatedUser();

        File savedFile = fileService.prepareFile(file, currentUser);

        if (project.getFiles() == null) {
            project.setFiles(new ArrayList<>());
        }

        // Записываем активность о добавлении файла.
        activityLogService.recordActivity(
                project.getId(),
                ActivityActionType.FILE_ADDED,
                ActivityEntityType.PROJECT,
                savedFile.getId(),
                savedFile.getName()
        );

        project.getFiles().add(savedFile);
        projectRepository.save(project);
    }

    // Получает список файлов, связанных с проектом.
    public List<FileResponse> getFilesByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        return project.getFiles().stream()
                .map(fileService::mapToFileResponse)
                .collect(Collectors.toList());
    }

    // Преобразует сущность Project в DTO ProjectResponse.
    private ProjectResponse mapToResponse(Project project) {
        return getProjectResponse(project);
    }

    // ========== PROJECT NOTES METHODS ==========

    // Создает новую заметку для проекта.
    public ProjectNoteResponse createProjectNote(Long projectId, String content) {
        User currentUser = getAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Проект не найден с ID: " + projectId));

        // Проверяем доступ
        boolean isParticipant = project.getParticipants().stream()
                .anyMatch(p -> p.getUser().getId().equals(currentUser.getId()));
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());

        if (!isParticipant && !isOwner) {
            throw new AccessDeniedException("Доступ запрещен: Вы не являетесь участником этого проекта.");
        }

        ProjectNote note = ProjectNote.builder()
                .project(project)
                .author(currentUser)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();

        ProjectNote savedNote = projectNoteRepository.save(note);
        return mapNoteToResponse(savedNote);
    }

    // Получает все заметки для проекта.
    public List<ProjectNoteResponse> getProjectNotes(Long projectId) {
        User currentUser = getAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Проект не найден с ID: " + projectId));

        // Проверяем доступ
        boolean isParticipant = project.getParticipants().stream()
                .anyMatch(p -> p.getUser().getId().equals(currentUser.getId()));
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());

        if (!isParticipant && !isOwner) {
            throw new AccessDeniedException("Доступ запрещен: Вы не являетесь участником этого проекта.");
        }

        return projectNoteRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::mapNoteToResponse)
                .collect(Collectors.toList());
    }

    // Удаляет заметку с проверкой прав доступа.
    public void deleteProjectNote(Long noteId) {
        User currentUser = getAuthenticatedUser();
        ProjectNote note = projectNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Заметка не найдена с ID: " + noteId));

        Project project = note.getProject();
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isAuthor = note.getAuthor().getId().equals(currentUser.getId());

        // Владелец может удалить любую заметку, участник - только свою
        if (!isOwner && !isAuthor) {
            throw new AccessDeniedException("Доступ запрещен: Вы можете удалять только свои заметки.");
        }

        projectNoteRepository.delete(note);
    }

    // Преобразует ProjectNote в DTO.
    private ProjectNoteResponse mapNoteToResponse(ProjectNote note) {
        return ProjectNoteResponse.builder()
                .id(note.getId())
                .projectId(note.getProject().getId())
                .author(mapUserToResponse(note.getAuthor()))
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .build();
    }

    // Преобразует User в UserResponse.
    private com.smartqurylys.backend.dto.user.UserResponse mapUserToResponse(User user) {
        return com.smartqurylys.backend.dto.user.UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .iinBin(user.getIinBin())
                .role(user.getRole())
                .build();
    }
}

