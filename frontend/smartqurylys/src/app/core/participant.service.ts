import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ParticipantResponse } from './models/participant'; 
import { UpdateParticipantRequest } from './models/project-requests'; 

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private apiUrl = `${environment.apiUrl}/participants`;
  private invitationApiUrl = `${environment.apiUrl}/invitations`;

  constructor(private http: HttpClient) { }

  getParticipantsByProject(projectId: number): Observable<ParticipantResponse[]> {
     return this.http.get<ParticipantResponse[]>(`${this.apiUrl}/project/${projectId}`);
  }

  updateParticipant(participantId: number, request: UpdateParticipantRequest): Observable<ParticipantResponse> {
    return this.http.patch<ParticipantResponse>(`${this.apiUrl}/${participantId}`, request);

  }

  removeParticipant(participantId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${participantId}`);
  }

  acceptInvitation(invitationId: number): Observable<void> {
    return this.http.post<void>(`${this.invitationApiUrl}/${invitationId}/accept`, {});
  }

  declineInvitation(invitationId: number): Observable<void> {
    return this.http.post<void>(`${this.invitationApiUrl}/${invitationId}/decline`, {});
  }
}