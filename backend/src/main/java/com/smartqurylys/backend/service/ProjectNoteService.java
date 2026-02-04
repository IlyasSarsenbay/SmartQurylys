package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.ProjectNoteResponse;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.ProjectNote;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.ProjectNoteRepository;
import com.smartqurylys.backend.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

// Сервис для управления заметками проекта.
@Service
@RequiredArgsConstructor
public class ProjectNoteService {

    private final ProjectNoteRepository projectNoteRepository;
    private final ProjectRepository projectRepository;
    private final UserService userService;

    // Создает новую заметку для проекта.
    @Transactional
    public ProjectNoteResponse createNote(Long projectId, String content) {
        User currentUser = userService.getCurrentUserEntity();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден с ID: " + projectId));

        // Проверяем, является ли пользователь участником или владельцем проекта
        boolean isParticipant = project.getParticipants().stream()
                .anyMatch(p -> p.getUser().getId().equals(currentUser.getId()));
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());

        if (!isParticipant && !isOwner) {
            throw new SecurityException("Доступ запрещен: Вы не являетесь участником этого проекта.");
        }

        ProjectNote note = ProjectNote.builder()
                .project(project)
                .author(currentUser)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();

        ProjectNote savedNote = projectNoteRepository.save(note);
        return mapToResponse(savedNote);
    }

    // Получает все заметки для указанного проекта.
    @Transactional(readOnly = true)
    public List<ProjectNoteResponse> getProjectNotes(Long projectId) {
        User currentUser = userService.getCurrentUserEntity();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден с ID: " + projectId));

        // Проверяем доступ
        boolean isParticipant = project.getParticipants().stream()
                .anyMatch(p -> p.getUser().getId().equals(currentUser.getId()));
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());

        if (!isParticipant && !isOwner) {
            throw new SecurityException("Доступ запрещен: Вы не являетесь участником этого проекта.");
        }

        return projectNoteRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Удаляет заметку с проверкой прав доступа.
    @Transactional
    public void deleteNote(Long noteId) {
        User currentUser = userService.getCurrentUserEntity();
        ProjectNote note = projectNoteRepository.findById(noteId)
                .orElseThrow(() -> new EntityNotFoundException("Заметка не найдена с ID: " + noteId));

        Project project = note.getProject();
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isAuthor = note.getAuthor().getId().equals(currentUser.getId());

        // Владелец может удалить любую заметку, участник - только свою
        if (!isOwner && !isAuthor) {
            throw new SecurityException("Доступ запрещен: Вы можете удалять только свои заметки.");
        }

        projectNoteRepository.delete(note);
    }

    // Преобразует сущность ProjectNote в DTO ProjectNoteResponse.
    private ProjectNoteResponse mapToResponse(ProjectNote note) {
        return ProjectNoteResponse.builder()
                .id(note.getId())
                .projectId(note.getProject().getId())
                .author(userService.mapToUserResponse(note.getAuthor()))
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .build();
    }
}
