package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.CreateProjectRequest;
import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.dto.project.ProjectResponse;
import com.smartqurylys.backend.dto.project.UpdateProjectRequest;
import com.smartqurylys.backend.dto.project.participant.CreateInvitationRequest;
import com.smartqurylys.backend.dto.project.participant.InvitationResponse;
import com.smartqurylys.backend.service.ParticipantInvitationService;
import com.smartqurylys.backend.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

// Контроллер для управления проектами.
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ParticipantInvitationService invitationService;
    private final com.smartqurylys.backend.service.UserService userService;

    // Создание нового проекта.
    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse created = projectService.createProject(request);
        return ResponseEntity.ok(created);
    }

    // Получение списка проектов текущего пользователя.
    @GetMapping("/my")
    public ResponseEntity<List<ProjectResponse>> getMyProjects() {
        List<ProjectResponse> projects = projectService.getMyProjects();
        return ResponseEntity.ok(projects);
    }

    // Получение всех проектов (только для администраторов).
    @GetMapping("/all")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        List<ProjectResponse> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }

    // Получение проекта по ID.
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    // Обновление данных проекта.
    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long id, @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    // Удаление проекта.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    // Отправка приглашения в проект.
    @PostMapping("/{id}/invitations")
    public ResponseEntity<InvitationResponse> invite(
            @PathVariable Long id,
            @Valid @RequestBody CreateInvitationRequest request
    ) {
        com.smartqurylys.backend.entity.User sender = userService.getCurrentUserEntity();
        return ResponseEntity.ok(invitationService.sendInvitation(id, request, sender));
    }

    // Загрузка файла в проект.
    @PostMapping("/{projectId}/files")
    public ResponseEntity<Void> uploadProjectFile(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        projectService.addFileToProject(projectId, file);
        return ResponseEntity.ok().build();
    }

    // Получение списка файлов проекта.
    @GetMapping("/{id}/files")
    public ResponseEntity<List<FileResponse>> getProjectFiles(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getFilesByProject(id));
    }

    // ========== PROJECT NOTES ENDPOINTS ==========

    // Создание заметки для проекта.
    @PostMapping("/{projectId}/notes")
    public ResponseEntity<com.smartqurylys.backend.dto.project.ProjectNoteResponse> createNote(
            @PathVariable Long projectId,
            @RequestBody com.smartqurylys.backend.dto.project.ProjectNoteRequest request) {
        com.smartqurylys.backend.dto.project.ProjectNoteResponse response =
                projectService.createProjectNote(projectId, request.getContent());
        return ResponseEntity.ok(response);
    }

    // Получение всех заметок проекта.
    @GetMapping("/{projectId}/notes")
    public ResponseEntity<List<com.smartqurylys.backend.dto.project.ProjectNoteResponse>> getProjectNotes(
            @PathVariable Long projectId) {
        List<com.smartqurylys.backend.dto.project.ProjectNoteResponse> notes =
                projectService.getProjectNotes(projectId);
        return ResponseEntity.ok(notes);
    }

    // Удаление заметки.
    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long noteId) {
        projectService.deleteProjectNote(noteId);
        return ResponseEntity.ok().build();
    }
}
