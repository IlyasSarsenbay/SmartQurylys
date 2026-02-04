import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'INVITATION' | 'PROJECT_UPDATE' | 'FILE_UPLOAD' | 'TASK_ASSIGNMENT' | 'MENTION' | 'STAGE_REACTIVATION' | 'LICENSE_APPROVED' | 'LICENSE_REJECTED';
  projectId: number;
  senderName: string;
  relatedEntityId: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) { }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read-all`, {});
  }

  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
  }

  createMentionNotification(mentionedUserId: number, conversationId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mention`, {
      mentionedUserId,
      conversationId
    });
  }
}
