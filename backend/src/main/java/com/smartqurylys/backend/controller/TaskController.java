package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.dto.project.task.*;
import com.smartqurylys.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.EntityNotFoundException;

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
            @RequestPart("taskData") @Valid CreateTaskRequest request,
            @RequestPart(value = "requirementSampleFiles", required = false) List<MultipartFile> requirementSampleFiles
    ) {
        try {
            TaskResponse response = taskService.createTask(stageId, request, requirementSampleFiles);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(@PathVariable Long stageId) {
            List<TaskResponse> tasks = taskService.getTasksByStage(stageId);
            return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTask(
            @PathVariable Long stageId,
            @PathVariable Long taskId
    ) {

            TaskResponse response = taskService.getTaskById(taskId);
            return ResponseEntity.ok(response);
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long stageId,
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
            TaskResponse response = taskService.updateTask(taskId, request);
            return ResponseEntity.ok(response);
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
    public ResponseEntity<TaskResponse> confirmExecution(
            @PathVariable Long stageId,
            @PathVariable Long taskId
    ) {
        TaskResponse response = taskService.confirmExecution(taskId);
            return ResponseEntity.ok(response);
    }

    @PostMapping("/{taskId}/decline-execution")
    public ResponseEntity<TaskResponse> declineExecution(
            @PathVariable Long stageId,
            @PathVariable Long taskId
    ) {
        TaskResponse response = taskService.declineExecution(taskId);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/{taskId}/files")
    public ResponseEntity<FileResponse> addFileToTask(
                                                       @PathVariable Long stageId,
                                                       @PathVariable Long taskId,
                                                       @RequestParam("file") MultipartFile file
    ) {
        try {
            FileResponse response = taskService.addFileToTask(taskId, file);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{taskId}/files")
    public ResponseEntity<List<FileResponse>> getFilesByTask(
                                                              @PathVariable Long stageId,
                                                              @PathVariable Long taskId
    ) {
            List<FileResponse> files = taskService.getFilesByTask(taskId);
            return ResponseEntity.ok(files);
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
    @PostMapping("/{taskId}/requirements")
    public ResponseEntity<RequirementResponse> createRequirement(
            @PathVariable Long stageId,
            @PathVariable Long taskId,
            @RequestPart("requirementData") @Valid CreateRequirementRequest request,
            @RequestPart(value = "sampleFile", required = false) MultipartFile sampleFile
    ) {
        try {
            RequirementResponse response = taskService.createRequirement(taskId, request, sampleFile);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/requirements/{requirementId}")
    public ResponseEntity<RequirementResponse> updateRequirement(
            @PathVariable Long stageId,
            @PathVariable Long requirementId,
            @RequestPart("requirementData") @Valid UpdateRequirementRequest request,
            @RequestPart(value = "newSampleFile", required = false) MultipartFile newSampleFile
    ) {
        try {
            RequirementResponse response = taskService.updateRequirement(requirementId, request, newSampleFile);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/requirements/{requirementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRequirement(
            @PathVariable Long stageId,
            @PathVariable Long requirementId
    ) throws IOException {
        taskService.deleteRequirement(requirementId);
    }

    @GetMapping("/{taskId}/requirements")
    public ResponseEntity<List<RequirementResponse>> getRequirementsByTaskId(
            @PathVariable Long stageId,
            @PathVariable Long taskId
    ) {
        List<RequirementResponse> requirements = taskService.getRequirementsByTaskId(taskId);
        return ResponseEntity.ok(requirements);
    }
}


