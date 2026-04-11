import { NgSwitch, NgSwitchCase } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { NotificationRealtimeService } from '../../core/notification-realtime.service';
import { NotificationService } from '../../core/notification.service';
import { MyProjectsComponent } from '../../projects/my-projects/my-projects.component';
import { ProjectsPanelComponent } from '../projects-panel/projects-panel.component';
import { NotificationsDialogComponent } from '../notifications-dialog/notifications-dialog.component';

type Panel = 'projects' | 'tasks' | 'contractors' | 'chats' | 'constructor' | null;

@Component({
  selector: 'app-new-side-menu',
  standalone: true,
  imports: [RouterLink, NgSwitch, NgSwitchCase, MyProjectsComponent, ProjectsPanelComponent, NotificationsDialogComponent],
  templateUrl: './new-side-menu.component.html',
  styleUrl: './new-side-menu.component.css'
})
export class NewSideMenuComponent implements OnInit, OnDestroy {
  activePanel: Panel = null;
  isNotificationsDialogOpen = false;
  private notificationRealtimeSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly notificationRealtimeService: NotificationRealtimeService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const currentUserId = this.authService.getUserId();
    if (currentUserId === null) {
      return;
    }

    this.notificationService.refreshNotifications().subscribe({
      error: (error) => {
        console.error('Failed to load notifications:', error);
      }
    });

    this.notificationRealtimeService.connectToUser(currentUserId);
    this.notificationRealtimeSubscription = this.notificationRealtimeService.events$
      .subscribe(() => {
        this.notificationService.refreshNotifications().subscribe({
          error: (error) => {
            console.error('Failed to refresh notifications after realtime event:', error);
          }
        });
      });
  }

  ngOnDestroy(): void {
    this.notificationRealtimeSubscription?.unsubscribe();
    this.notificationRealtimeService.disconnect();
  }

  togglePanel(panel: Panel): void {
    if (this.activePanel === panel) {
      this.activePanel = null;
      return;
    }
    this.activePanel = panel;
  }

  closePanel(): void {
    this.activePanel = null;
  }

  openNotificationsDialog(): void {
    this.activePanel = null;
    this.isNotificationsDialogOpen = true;
  }

  closeNotificationsDialog(): void {
    this.isNotificationsDialogOpen = false;
  }

  isPanelOpen(): boolean {
    return this.activePanel === 'projects' || this.activePanel === 'tasks';
  }
}
