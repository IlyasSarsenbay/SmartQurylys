package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.task.CreateTaskRequest;
import com.smartqurylys.backend.dto.project.task.TaskResponse;
import com.smartqurylys.backend.dto.project.task.UpdateTaskRequest;
import com.smartqurylys.backend.entity.File;
import com.smartqurylys.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/stages/{stageId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @PathVariable Long stageId,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        return ResponseEntity.ok(taskService.createTask(stageId, request));
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(@PathVariable Long stageId) {
        return ResponseEntity.ok(taskService.getTasksByStage(stageId));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTask(
            @PathVariable Long stageId,
            @PathVariable Long taskId
    ) {
        return ResponseEntity.ok(taskService.getTaskById(stageId, taskId));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long stageId,
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long stageId,
            @PathVariable Long taskId
    ) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{taskId}/priority")
    public ResponseEntity<Void> markAsPriority(
            @PathVariable Long stageId,
            @PathVariable Long taskId
    ) {
        taskService.markAsPriority(taskId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{taskId}/request-execution")
    public ResponseEntity<Void> requestExecution(
            @PathVariable Long stageId,
            @PathVariable Long taskId
    ) {
        taskService.requestExecution(taskId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{taskId}/confirm-execution")
    public ResponseEntity<Void> confirmExecution(
            @PathVariable Long stageId,
            @PathVariable Long taskId
    ) {
        taskService.confirmExecution(taskId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{taskId}/files")
    public ResponseEntity<Void> addFileToTask(
            @PathVariable Long stageId,
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        taskService.addFileToTask(taskId, file);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{taskId}/files")
    public ResponseEntity<List<File>> getFilesByTask(
            @PathVariable Long stageId,
            @PathVariable Long taskId
    ) {
        return ResponseEntity.ok(taskService.getFilesByTask(taskId));
    }

    @PostMapping("/{taskId}/dependencies/{dependencyTaskId}")
    public ResponseEntity<Void> addDependency(
            @PathVariable Long stageId,
            @PathVariable Long taskId,
            @PathVariable Long dependencyTaskId
    ) {
        taskService.addDependency(taskId, dependencyTaskId);
        return ResponseEntity.ok().build();
    }
}



