export interface ParticipantResponse {
  id: number;
  fullName: string;
  iinBin: string;
  role: string;
  organization: string;
  phone: string;
  email: string;
  canUploadDocuments: boolean;
  canSendNotifications: boolean;
}