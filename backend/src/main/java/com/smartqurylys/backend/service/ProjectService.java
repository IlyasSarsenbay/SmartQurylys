package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.CreateProjectRequest;
import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.dto.project.ProjectResponse;
import com.smartqurylys.backend.dto.project.UpdateProjectRequest;
import com.smartqurylys.backend.entity.City;
import com.smartqurylys.backend.entity.File;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.User;
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
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        User currentUser = getAuthenticatedUser();


        boolean isAdmin = currentUser.getRole().equals("ADMIN");
        boolean isOwner = project.getOwner() != null && project.getOwner().getId().equals(currentUser.getId());
        boolean isParticipant = project.getParticipants() != null &&
                project.getParticipants().stream()
                        .anyMatch(p -> p.getId().equals(currentUser.getId()));

        if (!isAdmin && !isOwner && !isParticipant) {
            throw new AccessDeniedException("Доступ запрещен: У вас нет прав для просмотра этого проекта.");
        }

        return mapToResponse(project);
    }

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream().map(project -> new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getStartDate(),
                project.getEndDate(),
                project.getType(),
                project.getStatus().name(),
                project.getCity().getName(),
                project.getOwner().getFullName()
        )).collect(Collectors.toList());
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
        
        if (!project.getOwner().getId().equals(currentUser.getId())) {
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
                ActivityEntityType.FILE,
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
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getStartDate(),
                project.getEndDate(),
                project.getType(),
                project.getStatus().name(),
                project.getCity().getName(),
                project.getOwner().getIinBin()
        );
    }
}

