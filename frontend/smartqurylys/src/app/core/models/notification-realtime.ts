export interface NotificationRealtimeEvent {
  userId: number;
  type: string;
  notificationId: number | null;
  occurredAt: string;
}
