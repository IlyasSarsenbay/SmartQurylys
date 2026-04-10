import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Notification, NotificationService } from '../../core/notification.service';
import { ParticipantService } from '../../core/participant.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-dialog.component.html',
  styleUrl: './notifications-dialog.component.css'
})
export class NotificationsDialogComponent implements OnInit, OnDestroy {
  @Output() closeDialog = new EventEmitter<void>();

  notifications: Notification[] = [];
  loading = false;
  private notificationsSubscription?: Subscription;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly participantService: ParticipantService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.notificationsSubscription = this.notificationService.notifications$
      .subscribe((notifications) => {
        this.notifications = notifications;
      });

    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.notificationsSubscription?.unsubscribe();
  }

  close(): void {
    this.closeDialog.emit();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.refreshNotifications().subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load notifications:', error);
        this.loading = false;
      }
    });
  }

  acceptInvitation(invitationId: number): void {
    this.participantService.acceptInvitation(invitationId).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Failed to accept invitation:', error);
      }
    });
  }

  declineInvitation(invitationId: number): void {
    this.participantService.declineInvitation(invitationId).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Failed to decline invitation:', error);
      }
    });
  }

  deleteNotification(notificationId: number): void {
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {},
      error: (error) => {
        console.error('Failed to delete notification:', error);
      }
    });
  }

  onNotificationClick(notification: Notification): void {
    if (notification.type === 'MENTION' && notification.relatedEntityId) {
      this.router.navigate(['/chat'], {
        queryParams: { conversationId: notification.relatedEntityId }
      });
      this.close();
    }
  }
}
