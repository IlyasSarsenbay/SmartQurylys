import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { mapParticipantResponsesToParticipants, Participant, ParticipantResponse } from './models/participant'; 
import { UpdateParticipantRequest } from './models/project-requests'; 

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private apiUrl = `${environment.apiUrl}/participants`;
  private invitationApiUrl = `${environment.apiUrl}/invitations`;
  private readonly projectParticipantsCache = new Map<number, Participant[]>();
  private readonly participantsChangedSubject = new Subject<number | null>();
  readonly participantsChanged$ = this.participantsChangedSubject.asObservable();

  constructor(private http: HttpClient) { }

  getParticipantsByProject(projectId: number): Observable<ParticipantResponse[]> {
     return this.http.get<ParticipantResponse[]>(`${this.apiUrl}/project/${projectId}`);
  }

  getProjectParticipants(projectId: number, forceRefresh = false): Observable<Participant[]> {
    const cachedParticipants = this.projectParticipantsCache.get(projectId);

    if (!forceRefresh && cachedParticipants) {
      return of(cachedParticipants);
    }

    return this.getParticipantsByProject(projectId).pipe(
      map(mapParticipantResponsesToParticipants),
      tap((participants) => this.projectParticipantsCache.set(projectId, participants))
    );
  }

  getInvitedParticipantsByProject(projectId: number): Observable<ParticipantResponse[]> {
    return this.http.get<ParticipantResponse[]>(`${this.apiUrl}/project/${projectId}/invitations`);
  }

  clearProjectParticipantsCache(projectId?: number): void {
    if (typeof projectId === 'number') {
      this.projectParticipantsCache.delete(projectId);
      return;
    }

    this.projectParticipantsCache.clear();
  }

  invalidateProjectParticipants(projectId?: number): void {
    this.clearProjectParticipantsCache(projectId);
    this.participantsChangedSubject.next(projectId ?? null);
  }

  updateParticipant(participantId: number, request: UpdateParticipantRequest): Observable<ParticipantResponse> {
    return this.http.patch<ParticipantResponse>(`${this.apiUrl}/${participantId}`, request).pipe(
      tap(() => this.invalidateProjectParticipants())
    );

  }

  removeParticipant(participantId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${participantId}`).pipe(
      tap(() => this.invalidateProjectParticipants())
    );
  }

  acceptInvitation(invitationId: number): Observable<void> {
    return this.http.post<void>(`${this.invitationApiUrl}/${invitationId}/accept`, {}).pipe(
      tap(() => this.invalidateProjectParticipants())
    );
  }

  declineInvitation(invitationId: number): Observable<void> {
    return this.http.post<void>(`${this.invitationApiUrl}/${invitationId}/decline`, {}).pipe(
      tap(() => this.invalidateProjectParticipants())
    );
  }
}
