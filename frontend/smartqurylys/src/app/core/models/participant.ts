export interface ParticipantResponse {
          id: number;
          fullName: string;
          iinBin: string;
          role: string;
          canUploadDocuments: boolean;
          canSendNotifications: boolean;
        }