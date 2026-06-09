export interface ActivityLogResponse {
  id: number;
  timestamp: string;
  actorId: number;
  actorFullName: string;
  actionType: string;
  entityType: string;
  entityId: number;
  entityName: string;
  details: string | null;
  projectId: number;
}