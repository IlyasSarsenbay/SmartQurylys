export interface ParticipantResponse {
          id: number;
          fullName: string;
          role: string;
          canUploadDocuments: boolean;
          canSendNotifications: boolean;
        }