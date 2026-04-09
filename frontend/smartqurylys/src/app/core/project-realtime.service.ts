import { Injectable, NgZone } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ProjectRealtimeEvent } from './models/project-realtime';

@Injectable({
  providedIn: 'root'
})
export class ProjectRealtimeService {
  private stompClient?: Client;
  private projectSubscription?: StompSubscription;
  private currentProjectId: number | null = null;
  private readonly eventsSubject = new Subject<ProjectRealtimeEvent>();

  readonly events$ = this.eventsSubject.asObservable();

  constructor(
    private readonly authService: AuthService,
    private readonly ngZone: NgZone
  ) {}

  connectToProject(projectId: number): void {
    this.currentProjectId = projectId;
    console.log('[ProjectRealtime] connect requested for project', projectId);

    if (!this.stompClient) {
      this.createClient();
    }

    if (this.stompClient?.connected) {
      this.subscribeToProject(projectId);
      return;
    }

    if (!this.stompClient?.active) {
      this.stompClient?.activate();
    }
  }

  disconnect(): void {
    this.currentProjectId = null;
    this.projectSubscription?.unsubscribe();
    this.projectSubscription = undefined;
    this.stompClient?.deactivate();
    this.stompClient = undefined;
  }

  private createClient(): void {
    const token = this.authService.getToken();
    const wsUrl = `${environment.apiUrl.replace('/api', '')}/ws`;
    console.log('[ProjectRealtime] creating STOMP client for', wsUrl);

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as never,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[ProjectRealtime] STOMP connected');
        if (this.currentProjectId !== null) {
          this.subscribeToProject(this.currentProjectId);
        }
      },
      onStompError: (frame) => {
        console.error('[ProjectRealtime] STOMP error:', frame);
      },
      onWebSocketError: (event) => {
        console.error('[ProjectRealtime] WebSocket error:', event);
      },
      onWebSocketClose: (event) => {
        console.warn('[ProjectRealtime] WebSocket closed:', event);
      }
    });
  }

  private subscribeToProject(projectId: number): void {
    if (!this.stompClient?.connected) {
      return;
    }

    this.projectSubscription?.unsubscribe();
    console.log('[ProjectRealtime] subscribing to', `/topic/projects/${projectId}/updates`);
    this.projectSubscription = this.stompClient.subscribe(
      `/topic/projects/${projectId}/updates`,
      (message: IMessage) => {
        try {
          const event = JSON.parse(message.body) as ProjectRealtimeEvent;
          console.log('[ProjectRealtime] event received:', event);
          this.ngZone.run(() => {
            this.eventsSubject.next(event);
          });
        } catch (error) {
          console.error('[ProjectRealtime] Failed to parse event:', error);
        }
      }
    );
  }
}
