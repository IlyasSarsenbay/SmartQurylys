import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TaskResponse, CreateTaskRequest, UpdateTaskRequest } from '../core/models/task';
import { FileResponse } from '../core/models/file';
import {
 RequirementResponse
} from '../core/models/requirement';

@Injectable({
 providedIn: 'root'
})
export class TaskService {
 private apiUrl = `${environment.apiUrl}/stages`; 

 constructor(private http: HttpClient) { }

  /**
   * Creates a new task with associated requirements and files.
   * @param stageId The ID of the stage to which the task belongs.
   * @param formData The FormData object containing task data and files.
   * @returns An Observable of the created TaskResponse.
   */
  createTask(stageId: number, formData: FormData): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.apiUrl}/${stageId}/tasks`, formData);
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

 declineExecution(stageId: number, taskId: number): Observable<void> {
  return this.http.post<void>(`${this.apiUrl}/${stageId}/tasks/${taskId}/decline-execution`, {});
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

 createRequirement(stageId: number, taskId: number, formData: FormData): Observable<RequirementResponse> {
  return this.http.post<RequirementResponse>(`${this.apiUrl}/${stageId}/tasks/${taskId}/requirements`, formData);
 }

 /**
   * Updates an existing requirement.
   * @param stageId The ID of the stage.
   * @param requirementId The ID of the requirement.
   * @param formData The FormData object containing requirementData and the new file.
   * @returns An Observable с updated requirement.
   */
 updateRequirement(stageId: number, requirementId: number, formData: FormData): Observable<RequirementResponse> {
  return this.http.put<RequirementResponse>(`${this.apiUrl}/${stageId}/tasks/requirements/${requirementId}`, formData);
 }

 /**
   * Deletes a requirement.
   * @param stageId The ID of the stage.
   * @param requirementId The ID of the requirement.
   * @returns Observable<void>
   */
 deleteRequirement(stageId: number, requirementId: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${stageId}/tasks/requirements/${requirementId}`);
 }

 /**
   * Gets all requirements for a specific task.
   * @param stageId The ID of the stage.
   * @param taskId The ID of the task.
   * @returns An Observable with an array of requirements.
   */
 getRequirementsByTask(stageId: number, taskId: number): Observable<RequirementResponse[]> {
  return this.http.get<RequirementResponse[]>(`${this.apiUrl}/${stageId}/tasks/${taskId}/requirements`);
 }

  downloadFile(fileId: string | number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${environment.apiUrl}/files/download/${fileId}`, {
      responseType: 'blob',
      observe: 'response'
    });
  }
}