import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './header/header.component';
import { NotificationService, Notification } from './core/notification.service';
import { ParticipantService } from './core/participant.service';
import { NotificationModalComponent } from "./notification-modal/notification-modal.component";
import { ToastComponent } from "./toast/toast.component";
import { interval, Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, NotificationModalComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'smartqurylys';
  currentRoute: string = '';
  showNotifications = false;
  notifications: Notification[] = [];
  unreadNotificationCount = 0;
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';
  private pollingSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private participantService: ParticipantService
  ) { }

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      let url = event.urlAfterRedirects.split('?')[0].split('#')[0];
      this.currentRoute = url === '' ? '/' : url;
      if (this.showAppHeader()) {
        this.fetchNotifications();
      }
    });

    // Poll for notifications every 30 seconds
    this.pollingSubscription = interval(30000).subscribe(() => {
      if (this.authService.isAuthenticated() && this.showAppHeader()) {
        this.fetchNotifications();
      }
    });
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
  }

  fetchNotifications() {
    this.notificationService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
      // FIX: Don't let background polling reset the counter while the modal is open
      if (!this.showNotifications) {
        this.unreadNotificationCount = this.notifications.filter(n => !n.isRead).length;
      }
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;

    // EXPLANATION TO USER: This is the exact method in app.component.ts 
    // where I force the counter to zero.
    if (this.showNotifications) {
      console.log('NOTIFICATIONS: Opening list, clearing counter optimistically');

      // Local update first for instant feedback (Optimistic UI)
      this.notifications.forEach(n => n.isRead = true);
      this.unreadNotificationCount = 0;

      this.notificationService.markAllAsRead().subscribe({
        next: () => {
          console.log('NOTIFICATIONS: Backend update (all) successful');
          this.fetchNotifications();
        },
        error: (err) => {
          console.error('NOTIFICATIONS: Error marking all as read:', err);
          this.fetchNotifications();
        }
      });
    }
  }

  onAcceptInvitation(invitationId: number) {
    this.participantService.acceptInvitation(invitationId).subscribe(() => {
      this.fetchNotifications();
      this.showToast('Приглашение принято', 'success');
      this.showNotifications = false;
    });
  }

  onDeclineInvitation(invitationId: number) {
    this.participantService.declineInvitation(invitationId).subscribe(() => {
      this.fetchNotifications();
      this.showToast('Приглашение отклонено', 'error');
      this.showNotifications = false;
    });
  }

  onNotificationClick(notification: any) {
    if (notification.type === 'MENTION') {
      this.router.navigate(['/chat'], { queryParams: { conversationId: notification.relatedEntityId } });
      this.notificationService.deleteNotification(notification.id).subscribe(() => {
        this.fetchNotifications();
      });
      this.showNotifications = false;
    }
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  showAppHeader(): boolean {
    const noHeaderRoutes = ['/', '/home', '/login', '/registerUser', '/forgot-password', '/register'];
    return !noHeaderRoutes.includes(this.currentRoute);
  }

  showProjectTabs(): boolean {
    return this.currentRoute.startsWith('/projects/') || this.currentRoute === '/create-project';
  }

  isDossierActive(): boolean {
    return this.currentRoute === '/create-project' || (this.currentRoute.startsWith('/projects/') && !this.currentRoute.includes('/participants') && !this.currentRoute.includes('/files'));
  }

  isParticipantsActive(): boolean {
    return this.currentRoute.includes('/projects/') && this.currentRoute.includes('/participants');
  }

  isFilesActive(): boolean {
    return this.currentRoute.includes('/projects/') && this.currentRoute.includes('/files');
  }
}
