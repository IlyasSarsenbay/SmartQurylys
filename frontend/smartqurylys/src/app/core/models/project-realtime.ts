export interface ProjectRealtimeEvent {
  projectId: number;
  type: string;
  entityId: number | null;
  occurredAt: string;
}
