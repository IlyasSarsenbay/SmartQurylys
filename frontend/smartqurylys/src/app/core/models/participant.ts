export interface ParticipantResponse {
  id: number;
  userId: number;
  fullName: string;
  iinBin: string;
  role: string;
  organization: string;
  phone: string;
  email: string;
  canUploadDocuments: boolean;
  canSendNotifications: boolean;
  owner: boolean;
}

export interface Participant {
  id: number;
  userId: number;
  fullName: string;
  iinBin: string;
  role: string;
  organization: string;
  phone: string;
  email: string;
  canUploadDocuments: boolean;
  canSendNotifications: boolean;
  owner: boolean;
}

export function mapParticipantResponseToParticipant(
  response: ParticipantResponse
): Participant {
  return {
    id: response.id,
    userId: response.userId,
    fullName: response.fullName,
    iinBin: response.iinBin,
    role: response.role,
    organization: response.organization,
    phone: response.phone,
    email: response.email,
    canUploadDocuments: response.canUploadDocuments,
    canSendNotifications: response.canSendNotifications,
    owner: response.owner,
  };
}

export function mapParticipantResponsesToParticipants(
  responses: ParticipantResponse[]
): Participant[] {
  return responses.map(mapParticipantResponseToParticipant);
}
