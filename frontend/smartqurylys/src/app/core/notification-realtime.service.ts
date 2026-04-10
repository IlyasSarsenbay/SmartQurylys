import { Injectable, NgZone } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { NotificationRealtimeEvent } from './models/notification-realtime';

@Injectable({
  providedIn: 'root'
})
export class NotificationRealtimeService {
  private stompClient?: Client;
  private notificationSubscription?: StompSubscription;
  private currentUserId: number | null = null;
  private readonly eventsSubject = new Subject<NotificationRealtimeEvent>();

  readonly events$ = this.eventsSubject.asObservable();

  constructor(
    private readonly authService: AuthService,
    private readonly ngZone: NgZone
  ) {}

  connectToUser(userId: number): void {
    this.currentUserId = userId;

    if (!this.stompClient) {
      this.createClient();
    }

    if (this.stompClient?.connected) {
      this.subscribeToUser(userId);
      return;
    }

    if (this.stompClient && !this.stompClient.active) {
      this.stompClient.activate();
    }
  }

  disconnect(): void {
    this.currentUserId = null;
    this.notificationSubscription?.unsubscribe();
    this.notificationSubscription = undefined;
    this.stompClient?.deactivate();
    this.stompClient = undefined;
  }

  private createClient(): void {
    const token = this.authService.getToken();
    const wsUrl = `${environment.apiUrl.replace('/api', '')}/ws`;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as never,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        if (this.currentUserId !== null) {
          this.subscribeToUser(this.currentUserId);
        }
      },
      onStompError: (frame) => {
        console.error('[NotificationRealtime] STOMP error:', frame);
      },
      onWebSocketError: (event) => {
        console.error('[NotificationRealtime] WebSocket error:', event);
      }
    });
  }

  private subscribeToUser(userId: number): void {
    if (!this.stompClient?.connected) {
      return;
    }

    this.notificationSubscription?.unsubscribe();
    this.notificationSubscription = this.stompClient.subscribe(
      `/topic/notifications/${userId}/updates`,
      (message: IMessage) => {
        try {
          const event = JSON.parse(message.body) as NotificationRealtimeEvent;
          this.ngZone.run(() => {
            this.eventsSubject.next(event);
          });
        } catch (error) {
          console.error('[NotificationRealtime] Failed to parse event:', error);
        }
      }
    );
  }
}
