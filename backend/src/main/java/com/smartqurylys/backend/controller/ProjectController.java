package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.CreateProjectRequest;
import com.smartqurylys.backend.dto.project.ProjectResponse;
import com.smartqurylys.backend.dto.project.UpdateProjectRequest;
import com.smartqurylys.backend.dto.project.participant.CreateInvitationRequest;
import com.smartqurylys.backend.dto.project.participant.InvitationResponse;
import com.smartqurylys.backend.service.ParticipantInvitationService;
import com.smartqurylys.backend.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ParticipantInvitationService invitationService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse created = projectService.createProject(request);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ProjectResponse>> getMyProjects() {
        List<ProjectResponse> projects = projectService.getMyProjects();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/all")
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        List<ProjectResponse> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long id, @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/invitations")
    public ResponseEntity<InvitationResponse> invite(
            @PathVariable Long id,
            @Valid @RequestBody CreateInvitationRequest request
    ) {
        return ResponseEntity.ok(invitationService.sendInvitation(id, request));
    }


}
