import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { StageResponse, CreateStageRequest, UpdateStageRequest } from '../core/models/stage';

@Injectable({
  providedIn: 'root'
})
export class StageService {
  private apiUrl = `${environment.apiUrl}/schedules`; 

  constructor(private http: HttpClient) { }

  createStage(scheduleId: number, request: CreateStageRequest): Observable<StageResponse> {
    return this.http.post<StageResponse>(`${this.apiUrl}/${scheduleId}/stages`, request);
  }

  getStages(scheduleId: number): Observable<StageResponse[]> {
    return this.http.get<StageResponse[]>(`${this.apiUrl}/${scheduleId}/stages`);
  }

  getStage(scheduleId: number, id: number): Observable<StageResponse> {
    return this.http.get<StageResponse>(`${this.apiUrl}/${scheduleId}/stages/${id}`);
  }

  updateStage(scheduleId: number, stageId: number, request: UpdateStageRequest): Observable<StageResponse> {
    return this.http.put<StageResponse>(`${this.apiUrl}/${scheduleId}/stages/${stageId}`, request);
  }

  deleteStage(scheduleId: number, stageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${scheduleId}/stages/${stageId}`);
  }
}
