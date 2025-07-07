
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProjectResponse } from './models/project';
import { CreateProjectRequest, UpdateProjectRequest, CreateInvitationRequest } from './models/project-requests';
import { InvitationResponse } from './models/project-invitation';
import { FileResponse } from './models/file';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) { }

  createProject(request: CreateProjectRequest): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(this.apiUrl, request);
  }

  getMyProjects(): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(`${this.apiUrl}/my`);
  }

  getAllProjects(): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(`${this.apiUrl}/all`);
  }

  getProjectById(id: number): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.apiUrl}/${id}`);
  }

  updateProject(id: number, request: UpdateProjectRequest): Observable<ProjectResponse> {
    return this.http.put<ProjectResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  inviteParticipant(projectId: number, request: CreateInvitationRequest): Observable<InvitationResponse> {
    return this.http.post<InvitationResponse>(`${this.apiUrl}/${projectId}/invitations`, request);
  }

  uploadProjectFile(projectId: number, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file); // 'file' должно совпадать с @RequestParam("file") на бэкенде
    return this.http.post<void>(`${this.apiUrl}/${projectId}/files`, formData);
  }

  getProjectFiles(projectId: number): Observable<FileResponse[]> {
    return this.http.get<FileResponse[]>(`${this.apiUrl}/${projectId}/files`);
  }
  deleteProjectFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/files/${fileId}`);
  }
}