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
  owner: boolean;
}

export interface Participant {
  id: number;
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
