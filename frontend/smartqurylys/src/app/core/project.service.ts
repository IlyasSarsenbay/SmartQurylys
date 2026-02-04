


import { Injectable } from '@angular/core';

import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http'; // Added HttpHeaders

import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import { ProjectResponse } from './models/project';

import { CreateProjectRequest, UpdateProjectRequest, CreateInvitationRequest } from './models/project-requests';

import { InvitationResponse } from './models/project-invitation';

import { FileResponse } from './models/file';

import { AuthService } from '../auth/auth.service'; // Import AuthService



@Injectable({

  providedIn: 'root'

})

export class ProjectService {

  private apiUrl = `${environment.apiUrl}/projects`;



  constructor(private http: HttpClient, private authService: AuthService) { } // Injected AuthService



  private getAuthHeaders(): HttpHeaders {

    const token = this.authService.getToken();

    if (token) {

      return new HttpHeaders({

        'Content-Type': 'application/json',

        'Authorization': `Bearer ${token}`

      });

    }

    return new HttpHeaders({ 'Content-Type': 'application/json' });

  }



  createProject(request: CreateProjectRequest): Observable<ProjectResponse> {

    return this.http.post<ProjectResponse>(this.apiUrl, request, { headers: this.getAuthHeaders() });

  }



  getMyProjects(): Observable<ProjectResponse[]> {

    return this.http.get<ProjectResponse[]>(`${this.apiUrl}/my`, { headers: this.getAuthHeaders() });

  }



  getAllProjects(): Observable<ProjectResponse[]> {

    return this.http.get<ProjectResponse[]>(`${this.apiUrl}/all`, { headers: this.getAuthHeaders() });

  }



  getProjectById(id: number): Observable<ProjectResponse> {

    return this.http.get<ProjectResponse>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });

  }



  updateProject(id: number, request: UpdateProjectRequest): Observable<ProjectResponse> {

    return this.http.put<ProjectResponse>(`${this.apiUrl}/${id}`, request, { headers: this.getAuthHeaders() });

  }



  deleteProject(id: number): Observable<void> {

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });

  }



  inviteParticipant(projectId: number, request: CreateInvitationRequest): Observable<InvitationResponse> {

    return this.http.post<InvitationResponse>(`${this.apiUrl}/${projectId}/invitations`, request, { headers: this.getAuthHeaders() });

  }



  uploadProjectFile(projectId: number, file: File): Observable<void> {

    const formData = new FormData();

    formData.append('file', file); // 'file' должно совпадать с @RequestParam("file") на бэкенде

    // FormData usually sets its own Content-Type, so we only need Authorization

    return this.http.post<void>(`${this.apiUrl}/${projectId}/files`, formData, {

      headers: new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` })

    });

  }



  getProjectFiles(projectId: number): Observable<FileResponse[]> {

    return this.http.get<FileResponse[]>(`${this.apiUrl}/${projectId}/files`, { headers: this.getAuthHeaders() });

  }

  deleteProjectFile(fileId: number): Observable<void> {

    return this.http.delete<void>(`${environment.apiUrl}/files/${fileId}`, { headers: this.getAuthHeaders() });

  }



  downloadFile(fileId: string | number): Observable<HttpResponse<Blob>> {

      return this.http.get(`${environment.apiUrl}/files/download/${fileId}`, {

        responseType: 'blob',

        observe: 'response',

        headers: this.getAuthHeaders()

      });

    }

}
