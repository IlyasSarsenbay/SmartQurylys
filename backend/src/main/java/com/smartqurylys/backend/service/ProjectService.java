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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final FileService fileService;
    private final ActivityLogService activityLogService;


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
        project.setStatus(ProjectStatus.DRAFT);
        project.setOwner(owner);
        project.setCity(city);
        project.setFiles(new ArrayList<>());
        project.setInvitations(new ArrayList<>());

        Schedule schedule = Schedule.builder()
                .name("ГПР")
                .project(project)
                .createdAt(LocalDateTime.now())
                .build();
        project.setSchedule(schedule);


        Project saved = projectRepository.save(project);

        return mapToResponse(saved);
    }

    public List<ProjectResponse> getMyProjects() {
        User owner = getAuthenticatedUser();

        return projectRepository.findAll().stream()
                .filter(project -> project.getOwner().getId().equals(owner.getId()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id) {
//        Project project = projectRepository.findById(id)
//                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));
        System.out.println("Попытка доступа к проекту с ID: " + id);

        Project project = projectRepository.findByIdWithParticipants(id)
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

        if (!isAdmin && !isOwner && !isParticipant) {
            System.out.println("Доступ запрещен для пользователя " + currentUser.getId() + " к проекту " + id);
            throw new AccessDeniedException("Доступ запрещен: У вас нет прав для просмотра этого проекта.");
        }

        System.out.println("Доступ разрешен для пользователя " + currentUser.getId() + " к проекту " + id);
        return mapToResponse(project);
    }

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream().map(this::getProjectResponse).collect(Collectors.toList());
    }

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

    private User getAuthenticatedUser() {
        String email = getAuthenticatedEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    private String getAuthenticatedEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        } else {
            return principal.toString();
        }
    }

    public void addFileToProject(Long projectId, MultipartFile file) throws IOException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        User currentUser = getAuthenticatedUser();

        File savedFile = fileService.prepareFile(file, currentUser);

        if (project.getFiles() == null) {
            project.setFiles(new ArrayList<>());
        }

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

    public List<FileResponse> getFilesByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        return project.getFiles().stream()
                .map(fileService::mapToFileResponse)
                .collect(Collectors.toList());
    }

    private ProjectResponse mapToResponse(Project project) {
        return getProjectResponse(project);
    }
}

