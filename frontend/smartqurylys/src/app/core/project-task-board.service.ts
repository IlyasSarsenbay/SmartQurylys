import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BulkDeleteProjectTaskBoardTasksRequest,
  CreateProjectTaskBoardStageRequest,
  CreateProjectTaskBoardTaskRequest,
  ProjectTaskBoardCompletionActionRequest,
  CreateProjectTaskCommentRequest,
  ProjectTaskBoardResponse,
  ProjectTaskBoardStageResponse,
  ProjectTaskBoardTaskResponse,
  ProjectTaskCommentResponse,
  UpdateProjectTaskBoardStageRequest,
  UpdateProjectTaskBoardTaskRequest
} from './models/project-task-board';

@Injectable({
  providedIn: 'root'
})
export class ProjectTaskBoardService {
  constructor(private readonly http: HttpClient) {}

  getBoard(projectId: number): Observable<ProjectTaskBoardResponse> {
    return this.http.get<ProjectTaskBoardResponse>(`${environment.apiUrl}/projects/${projectId}/task-board`);
  }

  createStage(projectId: number, request: CreateProjectTaskBoardStageRequest): Observable<ProjectTaskBoardStageResponse> {
    return this.http.post<ProjectTaskBoardStageResponse>(
      `${environment.apiUrl}/projects/${projectId}/task-board/stages`,
      request
    );
  }

  updateStage(
    projectId: number,
    stageId: number,
    request: UpdateProjectTaskBoardStageRequest
  ): Observable<ProjectTaskBoardStageResponse> {
    return this.http.patch<ProjectTaskBoardStageResponse>(
      `${environment.apiUrl}/projects/${projectId}/task-board/stages/${stageId}`,
      request
    );
  }

  deleteStage(projectId: number, stageId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/projects/${projectId}/task-board/stages/${stageId}`);
  }

  createTask(projectId: number, request: CreateProjectTaskBoardTaskRequest): Observable<ProjectTaskBoardTaskResponse> {
    return this.http.post<ProjectTaskBoardTaskResponse>(
      `${environment.apiUrl}/projects/${projectId}/task-board/tasks`,
      request
    );
  }

  updateTask(
    projectId: number,
    taskId: number,
    request: UpdateProjectTaskBoardTaskRequest
  ): Observable<ProjectTaskBoardTaskResponse> {
    return this.http.patch<ProjectTaskBoardTaskResponse>(
      `${environment.apiUrl}/projects/${projectId}/task-board/tasks/${taskId}`,
      request
    );
  }

  deleteTask(projectId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/projects/${projectId}/task-board/tasks/${taskId}`);
  }

  bulkDeleteTasks(projectId: number, request: BulkDeleteProjectTaskBoardTasksRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/projects/${projectId}/task-board/tasks/bulk-delete`, request);
  }

  requestCompletion(projectId: number, taskId: number): Observable<ProjectTaskBoardTaskResponse> {
    return this.http.post<ProjectTaskBoardTaskResponse>(
      `${environment.apiUrl}/projects/${projectId}/task-board/tasks/${taskId}/request-completion`,
      {}
    );
  }

  startTask(projectId: number, taskId: number): Observable<ProjectTaskBoardTaskResponse> {
    return this.http.post<ProjectTaskBoardTaskResponse>(
      `${environment.apiUrl}/projects/${projectId}/task-board/tasks/${taskId}/start`,
      {}
    );
  }

  approveCompletion(
    projectId: number,
    taskId: number,
    request: ProjectTaskBoardCompletionActionRequest
  ): Observable<ProjectTaskBoardTaskResponse> {
    return this.http.post<ProjectTaskBoardTaskResponse>(
      `${environment.apiUrl}/projects/${projectId}/task-board/tasks/${taskId}/approve-completion`,
      request
    );
  }

  rejectCompletion(
    projectId: number,
    taskId: number,
    request: ProjectTaskBoardCompletionActionRequest
  ): Observable<ProjectTaskBoardTaskResponse> {
    return this.http.post<ProjectTaskBoardTaskResponse>(
      `${environment.apiUrl}/projects/${projectId}/task-board/tasks/${taskId}/reject-completion`,
      request
    );
  }

  getComments(projectId: number, taskId: number): Observable<ProjectTaskCommentResponse[]> {
    return this.http.get<ProjectTaskCommentResponse[]>(
      `${environment.apiUrl}/projects/${projectId}/task-board/tasks/${taskId}/comments`
    );
  }

  addComment(
    projectId: number,
    taskId: number,
    request: CreateProjectTaskCommentRequest
  ): Observable<ProjectTaskCommentResponse> {
    return this.http.post<ProjectTaskCommentResponse>(
      `${environment.apiUrl}/projects/${projectId}/task-board/tasks/${taskId}/comments`,
      request
    );
  }
}
