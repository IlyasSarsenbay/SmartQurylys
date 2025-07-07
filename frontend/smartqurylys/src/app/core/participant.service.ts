import { Injectable } from '@angular/core';
        import { HttpClient } from '@angular/common/http';
        import { Observable } from 'rxjs';
        import { environment } from '../../environments/environment';
        import { ParticipantResponse } from './models/participant';

        @Injectable({
          providedIn: 'root'
        })
        export class ParticipantService {
          private apiUrl = `${environment.apiUrl}/participants`;

          constructor(private http: HttpClient) { }

          getParticipantsByProject(projectId: number): Observable<ParticipantResponse[]> {
            return this.http.get<ParticipantResponse[]>(`${this.apiUrl}/project/${projectId}`);
          }

          removeParticipant(participantId: number): Observable<void> {
            return this.http.delete<void>(`${this.apiUrl}/${participantId}`);
          }
        }