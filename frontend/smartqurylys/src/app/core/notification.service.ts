import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { NotificationRealtimeService } from './notification-realtime.service';

export interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  type:
    | 'INVITATION'
    | 'PROJECT_UPDATE'
    | 'FILE_UPLOAD'
    | 'TASK_ASSIGNMENT'
    | 'TASK_REVIEW_REQUESTED'
    | 'MENTION'
    | 'STAGE_REACTIVATION'
    | 'LICENSE_APPROVED'
    | 'LICENSE_REJECTED'
    | 'TASK_ACCEPTED'
    | 'TASK_DECLINED'
    | 'TASK_RETURNED';
  projectId: number;
  senderName: string;
  relatedEntityId: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private readonly notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private realtimeSubscription?: Subscription;

  readonly notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationRealtimeService: NotificationRealtimeService
  ) {
    this.initRealtime();
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl).pipe(
      tap((notifications) => this.notificationsSubject.next(notifications))
    );
  }

  refreshNotifications(): Observable<Notification[]> {
    return this.getNotifications();
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        const updatedNotifications = this.notificationsSubject.value.map((notification) => ({
          ...notification,
          isRead: true
        }));
        this.notificationsSubject.next(updatedNotifications);
      })
    );
  }

  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => {
        const updatedNotifications = this.notificationsSubject.value.filter(
          (notification) => notification.id !== notificationId
        );
        this.notificationsSubject.next(updatedNotifications);
      })
    );
  }

  createMentionNotification(mentionedUserId: number, conversationId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mention`, {
      mentionedUserId,
      conversationId
    });
  }

  private initRealtime(): void {
    const currentUserId = this.authService.getUserId();

    if (currentUserId !== null) {
      this.connectRealtime(currentUserId);
      return;
    }

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user?.id) {
          this.connectRealtime(user.id);
        }
      },
      error: (error) => {
        console.error('Failed to resolve current user for notification realtime:', error);
      }
    });
  }

  private connectRealtime(userId: number): void {
    this.notificationRealtimeService.connectToUser(userId);
    this.realtimeSubscription?.unsubscribe();
    this.realtimeSubscription = this.notificationRealtimeService.events$
      .subscribe(() => {
        this.refreshNotifications().subscribe({
          error: (error) => {
            console.error('Failed to refresh notifications after realtime event:', error);
          }
        });
      });
  }
}
