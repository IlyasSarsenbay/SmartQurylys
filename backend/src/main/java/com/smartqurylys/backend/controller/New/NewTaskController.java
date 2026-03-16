package com.smartqurylys.backend.controller.New;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.smartqurylys.backend.dto.project.task.CreateTaskRequest;
import com.smartqurylys.backend.dto.project.task.TaskResponse;
import com.smartqurylys.backend.service.TaskService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NewTaskController {

    private final TaskService taskService;

    @PostMapping("/tasks")
    public ResponseEntity<TaskResponse> createTask(
            @RequestPart("taskData") @Valid CreateTaskRequest request,
            @RequestPart(value = "requirementSampleFiles", required = false) List<MultipartFile> requirementSampleFiles) {
        try {
            TaskResponse response = taskService.createTask(request, requirementSampleFiles);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Получение задачи по ID.
    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getTask(
            @PathVariable Long taskId) {
        TaskResponse response = taskService.getTaskById(taskId);
        return ResponseEntity.ok(response);
    }

    // Получение ВСЕХ задач ПРОЕКТА
    @GetMapping("projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> getAllTasks(@PathVariable Long projectId) {
        List<TaskResponse> tasks = taskService.getTasksByProject(projectId);
        return ResponseEntity.ok(tasks);
    }

    // Получить число задач для данного проекта
    @GetMapping("projects/{projectId}/tasks/count")
    public ResponseEntity<Integer> getTasksCount(@PathVariable Long projectId) {
        int count = taskService.getTasksCount(projectId);
        return ResponseEntity.ok(count);
    }
}
