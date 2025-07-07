import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ScheduleResponse, CreateScheduleRequest, UpdateScheduleRequest } from '../core/models/schedule';
import { FileResponse } from '../core/models/file';


@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) { }

  createSchedule(projectId: number, request: CreateScheduleRequest): Observable<ScheduleResponse> {
    return this.http.post<ScheduleResponse>(`${this.apiUrl}/${projectId}/schedules`, request);
  }

  getSchedulesByProject(projectId: number): Observable<ScheduleResponse[]> {
    return this.http.get<ScheduleResponse[]>(`${this.apiUrl}/${projectId}/schedules`);
  }

  updateSchedule(projectId: number, request: UpdateScheduleRequest): Observable<ScheduleResponse> {
    return this.http.put<ScheduleResponse>(`${this.apiUrl}/${projectId}/schedules`, request);
  }

  deleteSchedule(projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/schedules`);
  }

  addFileToSchedule(projectId: number, file: FormData): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${projectId}/schedules/files`, file);
  }

  getFilesBySchedule(projectId: number): Observable<FileResponse[]> {
    return this.http.get<FileResponse[]>(`${this.apiUrl}/${projectId}/schedules/files`);
  }
}