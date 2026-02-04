package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.CreateScheduleRequest;
import com.smartqurylys.backend.dto.project.ScheduleResponse;
import com.smartqurylys.backend.dto.project.UpdateScheduleRequest;
import com.smartqurylys.backend.entity.File;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.Schedule;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.ProjectRepository;
import com.smartqurylys.backend.repository.ScheduleRepository;
import com.smartqurylys.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

// Сервис для управления графиками работ (ГПР) в рамках проектов.
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FileService fileService;

    // Создает новый график работ для указанного проекта. Доступно только владельцу проекта.
    public ScheduleResponse createSchedule(Long projectId, CreateScheduleRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        User currentUser = getAuthenticatedUser();

        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new SecurityException("Вы не являетесь владельцем проекта");
        }

        if (scheduleRepository.findByProject(project).isPresent()) {
            throw new IllegalArgumentException("ГПР уже существует для этого проекта"); // Проверяем уникальность ГПР для проекта.
        }

        Schedule schedule = Schedule.builder()
                .name(request.getName())
                .project(project)
                .createdAt(LocalDateTime.now())
                .build();

        return mapToResponse(scheduleRepository.save(schedule));
    }

    // Получает графики работ для указанного проекта.
    public List<ScheduleResponse> getSchedulesByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        Schedule schedule = scheduleRepository.findByProject(project)
                .orElseThrow(() -> new IllegalArgumentException("ГПР не найден"));

        return scheduleRepository.findByProject(project).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Обновляет информацию о графике работ. Доступно только владельцу проекта.
    public ScheduleResponse updateSchedule(Long projectId, UpdateScheduleRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        User currentUser = getAuthenticatedUser();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new SecurityException("Вы не являетесь владельцем проекта");
        }

        Schedule schedule = scheduleRepository.findByProject(project)
                .orElseThrow(() -> new IllegalArgumentException("ГПР не найден"));

        schedule.setName(request.getName());
        scheduleRepository.save(schedule);

        return mapToResponse(schedule);
    }

    // Удаляет график работ для указанного проекта. Доступно только владельцу проекта.
    @Transactional
    public void deleteSchedule(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        User currentUser = getAuthenticatedUser();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new SecurityException("Вы не являетесь владельцем проекта");
        }
        Schedule schedule =  scheduleRepository.findByProject(project)
                .orElseThrow(() -> new IllegalArgumentException("ГПР не найден"));
        scheduleRepository.delete(schedule);
        project.setSchedule(null); // Отвязываем график от проекта.
        projectRepository.save(project);
    }

    // Преобразует сущность Schedule в DTO ScheduleResponse.
    private ScheduleResponse mapToResponse(Schedule schedule) {
        return ScheduleResponse.builder()
                .id(schedule.getId())
                .name(schedule.getName())
                .projectName(schedule.getProject().getName())
                .createdAt(schedule.getCreatedAt())
                .build();
    }

    // Получает аутентифицированного пользователя из контекста безопасности.
    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = (principal instanceof UserDetails userDetails)
                ? userDetails.getUsername()
                : principal.toString();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    // Добавляет файл к графику работ.
    public void addFileToScedule(Long projectId, MultipartFile file) throws IOException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        Schedule schedule = scheduleRepository.findByProject(project)
                .orElseThrow(() -> new IllegalArgumentException("ГПР не найден"));

        User currentUser = getAuthenticatedUser();

        File savedFile = fileService.prepareFile(file, currentUser);

        if (schedule.getFiles() == null) {
            schedule.setFiles(new ArrayList<>());
        }

        schedule.getFiles().add(savedFile);
        scheduleRepository.save(schedule);
    }

    // Получает список файлов, связанных с графиком работ.
    public List<File> getFilesBySchedule(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        Schedule schedule = scheduleRepository.findByProject(project)
                .orElseThrow(() -> new IllegalArgumentException("ГПР не найден"));

        return schedule.getFiles();
    }
}

