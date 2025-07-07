import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TaskResponse, CreateTaskRequest, UpdateTaskRequest } from '../core/models/task';
import { FileResponse } from '../core/models/file';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/stages`; 

  constructor(private http: HttpClient) { }

  createTask(stageId: number, request: CreateTaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.apiUrl}/${stageId}/tasks`, request);
  }

  getTasksByStage(stageId: number): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${this.apiUrl}/${stageId}/tasks`);
  }

  getTaskById(stageId: number, taskId: number): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.apiUrl}/${stageId}/tasks/${taskId}`);
  }

  updateTask(stageId: number, taskId: number, request: UpdateTaskRequest): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.apiUrl}/${stageId}/tasks/${taskId}`, request);
  }

  deleteTask(stageId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${stageId}/tasks/${taskId}`);
  }

  markAsPriority(stageId: number, taskId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${stageId}/tasks/${taskId}/priority`, {});
  }

  requestExecution(stageId: number, taskId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${stageId}/tasks/${taskId}/request-execution`, {});
  }

  confirmExecution(stageId: number, taskId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${stageId}/tasks/${taskId}/confirm-execution`, {});
  }

  addFileToTask(stageId: number, taskId: number, file: FormData): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${stageId}/tasks/${taskId}/files`, file);
  }

  getFilesByTask(stageId: number, taskId: number): Observable<FileResponse[]> {
    return this.http.get<FileResponse[]>(`${this.apiUrl}/${stageId}/tasks/${taskId}/files`);
  }

  addDependency(stageId: number, taskId: number, dependencyTaskId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${stageId}/tasks/${taskId}/dependencies/${dependencyTaskId}`, {});
  }
}