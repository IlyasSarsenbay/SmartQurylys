package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.taskboard.*;
import com.smartqurylys.backend.service.ProjectTaskBoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/task-board")
@RequiredArgsConstructor
public class ProjectTaskBoardController {

    private final ProjectTaskBoardService projectTaskBoardService;

    @GetMapping
    public ResponseEntity<ProjectTaskBoardResponse> getBoard(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectTaskBoardService.getBoard(projectId));
    }

    @PostMapping("/stages")
    public ResponseEntity<ProjectTaskBoardStageResponse> createStage(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateProjectTaskBoardStageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectTaskBoardService.createStage(projectId, request));
    }

    @PatchMapping("/stages/{stageId}")
    public ResponseEntity<ProjectTaskBoardStageResponse> updateStage(
            @PathVariable Long projectId,
            @PathVariable Long stageId,
            @Valid @RequestBody UpdateProjectTaskBoardStageRequest request
    ) {
        return ResponseEntity.ok(projectTaskBoardService.updateStage(projectId, stageId, request));
    }

    @DeleteMapping("/stages/{stageId}")
    public ResponseEntity<Void> deleteStage(
            @PathVariable Long projectId,
            @PathVariable Long stageId
    ) {
        projectTaskBoardService.deleteStage(projectId, stageId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tasks")
    public ResponseEntity<ProjectTaskBoardTaskResponse> createTask(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateProjectTaskBoardTaskRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectTaskBoardService.createTask(projectId, request));
    }

    @PatchMapping("/tasks/{taskId}")
    public ResponseEntity<ProjectTaskBoardTaskResponse> updateTask(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateProjectTaskBoardTaskRequest request
    ) {
        return ResponseEntity.ok(projectTaskBoardService.updateTask(projectId, taskId, request));
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        projectTaskBoardService.deleteTask(projectId, taskId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tasks/bulk-delete")
    public ResponseEntity<Void> bulkDeleteTasks(
            @PathVariable Long projectId,
            @Valid @RequestBody BulkDeleteProjectTaskBoardTasksRequest request
    ) {
        projectTaskBoardService.bulkDeleteTasks(projectId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tasks/{taskId}/request-completion")
    public ResponseEntity<ProjectTaskBoardTaskResponse> requestCompletion(
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        return ResponseEntity.ok(projectTaskBoardService.requestCompletion(projectId, taskId));
    }

    @PostMapping("/tasks/{taskId}/approve-completion")
    public ResponseEntity<ProjectTaskBoardTaskResponse> approveCompletion(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestBody(required = false) ProjectTaskBoardCompletionActionRequest request
    ) {
        return ResponseEntity.ok(projectTaskBoardService.approveCompletion(
                projectId,
                taskId,
                request != null ? request.getReason() : null
        ));
    }

    @PostMapping("/tasks/{taskId}/reject-completion")
    public ResponseEntity<ProjectTaskBoardTaskResponse> rejectCompletion(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestBody(required = false) ProjectTaskBoardCompletionActionRequest request
    ) {
        return ResponseEntity.ok(projectTaskBoardService.rejectCompletion(
                projectId,
                taskId,
                request != null ? request.getReason() : null
        ));
    }

    @GetMapping("/tasks/{taskId}/comments")
    public ResponseEntity<List<ProjectTaskCommentResponse>> getComments(
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        return ResponseEntity.ok(projectTaskBoardService.getComments(projectId, taskId));
    }

    @PostMapping("/tasks/{taskId}/comments")
    public ResponseEntity<ProjectTaskCommentResponse> addComment(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody CreateProjectTaskCommentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectTaskBoardService.addComment(projectId, taskId, request));
    }
}
