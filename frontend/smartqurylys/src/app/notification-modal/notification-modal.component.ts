import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.css']
})
export class NotificationModalComponent {
  @Input() notifications: any[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() acceptInvitation = new EventEmitter<number>();
  @Output() declineInvitation = new EventEmitter<number>();
  @Output() notificationClick = new EventEmitter<any>();

  close() {
    this.closeModal.emit();
  }

  accept(invitationId: number) {
    this.acceptInvitation.emit(invitationId);
  }

  decline(invitationId: number) {
    this.declineInvitation.emit(invitationId);
  }

  onNotificationClick(notification: any) {
    this.notificationClick.emit(notification);
  }
}