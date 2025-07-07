
export interface InvitationResponse {
  id: number;
  projectName: string;
  userFullName: string;
  role: string;
  canUploadDocuments: boolean;
  canSendNotifications: boolean;
  createdAt: string; 
  expiresAt: string; 
}
