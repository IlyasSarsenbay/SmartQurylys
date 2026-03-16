import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../core/notification.service';
import { ParticipantService } from '../core/participant.service';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.css']
})
export class NotificationModalComponent implements OnInit {
  @Input() notifications: any[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() acceptInvitation = new EventEmitter<number>();
  @Output() declineInvitation = new EventEmitter<number>();
  @Output() notificationClick = new EventEmitter<any>();

  constructor(
    private notificationService: NotificationService,
    private participantService: ParticipantService
  ) { }

  ngOnInit(): void {
    this.notificationService.getNotifications()
      .subscribe(value => {
        this.notifications = value
      })
  }

  close() {
    this.closeModal.emit();
  }

  accept(invitationId: number) {
    // this.acceptInvitation.emit(invitationId);
    this.participantService.acceptInvitation(invitationId)
      .subscribe({
        next: () => {
          console.log('Successfuly accepted invitation');
        },
        error: (err) => {
          console.log('Accept Invitation Request failed', err.status);
        }
      });
  }

  decline(invitationId: number) {
    // this.declineInvitation.emit(invitationId);
  }

  onNotificationClick(notification: any) {
    // this.notificationClick.emit(notification);
  }
}