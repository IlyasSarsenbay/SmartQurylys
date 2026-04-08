


import { Injectable } from '@angular/core';

import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http'; // Added HttpHeaders

import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';

import { mapProjectResponsesToProjects, mapProjectResponseToProject, Project, ProjectResponse } from './models/project';

import { CreateProjectRequest, UpdateProjectRequest, CreateInvitationRequest, mapToUpdateProjectRequest } from './models/project-requests';

import { InvitationResponse } from './models/project-invitation';

import { FileResponse } from './models/file';

import { AuthService } from '../auth/auth.service'; // Import AuthService
import { ParticipantService } from './participant.service';
import { ScheduleService } from './schedule.service';



@Injectable({

  providedIn: 'root'

})

export class ProjectService {

  private apiUrl = `${environment.apiUrl}/projects`;
  private readonly projectCache = new Map<number, Project>();
  private readonly activeProjectSubject = new BehaviorSubject<Project | null>(null);
  readonly activeProject$ = this.activeProjectSubject.asObservable();



  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private participantService: ParticipantService,
    private scheduleService: ScheduleService
  ) { } // Injected AuthService



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


  // TODO: Нужно удалить  и заменить на фунцию ниже (getMyProjects)
  getMyProjectsResponses(): Observable<ProjectResponse[]> {

    return this.http.get<ProjectResponse[]>(`${this.apiUrl}/my`, { headers: this.getAuthHeaders() });

  }

  getMyProjects(): Observable<Project[]> {
    return this.http.get<ProjectResponse[]>(`${this.apiUrl}/my`, { headers: this.getAuthHeaders() })
      .pipe(map(mapProjectResponsesToProjects))
  }



  getAllProjects(): Observable<ProjectResponse[]> {

    return this.http.get<ProjectResponse[]>(`${this.apiUrl}/all`, { headers: this.getAuthHeaders() });

  }


  // TODO: Нужно удалить  и заменить на фунцию ниже (getProjectById)
  getProjectResponseById(id: number): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  getProjectById(id: number): Observable<Project> {
    const cachedProject = this.projectCache.get(id);

    if (cachedProject) {
      return of(cachedProject);
    }

    return this.http.get<ProjectResponse>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        map(mapProjectResponseToProject),
        tap((project) => this.setCachedProject(project))
      )
  }

  DEPRECATED_updateProject(id: number, request: UpdateProjectRequest): Observable<ProjectResponse> {
    console.log("PUT req", id, request)
    return this.http.put<ProjectResponse>(`${this.apiUrl}/${id}`, request, { headers: this.getAuthHeaders() });
  }

  updateProject(project: Project): Observable<Project> {
    const id = project.id
    const request = mapToUpdateProjectRequest(project)
    return this.http.put<ProjectResponse>(`${this.apiUrl}/${id}`, request, { headers: this.getAuthHeaders() })
    .pipe(
      map(mapProjectResponseToProject),
      tap((updatedProject) => this.setCachedProject(updatedProject))
    );
  }

  setActiveProject(projectId: number): Observable<Project> {
    const cachedProject = this.projectCache.get(projectId);

    if (cachedProject) {
      this.activeProjectSubject.next(cachedProject);
      return of(cachedProject);
    }

    return this.http.get<ProjectResponse>(`${this.apiUrl}/${projectId}`, { headers: this.getAuthHeaders() })
      .pipe(
        map(mapProjectResponseToProject),
        tap((project) => {
          this.setCachedProject(project);
          this.activeProjectSubject.next(project);
        })
      );
  }

  getActiveProjectSnapshot(): Project | null {
    return this.activeProjectSubject.value;
  }

  private setCachedProject(project: Project): void {
    this.projectCache.set(project.id, project);

    if (this.activeProjectSubject.value?.id === project.id) {
      this.activeProjectSubject.next(project);
    }
  }

  deleteProject(id: number): Observable<void> {

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });

  }



  inviteParticipant(projectId: number, request: CreateInvitationRequest): Observable<InvitationResponse> {

    return this.http.post<InvitationResponse>(`${this.apiUrl}/${projectId}/invitations`, request, { headers: this.getAuthHeaders() }).pipe(
      tap(() => this.participantService.invalidateProjectParticipants(projectId))
    );

  }



  uploadProjectFile(projectId: number, file: File): Observable<FileResponse> {

    const formData = new FormData();

    formData.append('file', file); // 'file' должно совпадать с @RequestParam("file") на бэкенде

    // FormData usually sets its own Content-Type, so we only need Authorization

    return this.http.post<FileResponse>(`${this.apiUrl}/${projectId}/files`, formData, {

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
