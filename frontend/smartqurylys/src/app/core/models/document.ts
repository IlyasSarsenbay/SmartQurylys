export interface DocumentRequest {
  projectId: number;
  name: string;
  uploadDate: string;
  status: DocumentStatus;
  fileIds?: number[];
  haveToSignParticipantIds?: number[];
  signedParticipantIds?: number[];
}

export interface DocumentShortResponse {
  id: number;
  name: string;
  status: DocumentStatus;
  uploadDate: Date;
  uploaderEmail: string;
  uploaderName: string;
}

export enum DocumentStatus {
  WAITING = 'WAITING',           // Ожидает начала работы
  CREATION = 'CREATION',         // На стадии создания
  APPROVAL = 'APPROVAL',         // На стадии утверждения
  SIGNATURE = 'SIGNATURE',       // На стадии подписания
  REGISTRATION = 'REGISTRATION', // На стадии регистрации
  IN_PROGRESS = 'IN_PROGRESS',   // В процессе работы
  COMPLETED = 'COMPLETED'        // Завершен
}

export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  [DocumentStatus.WAITING]: 'Ожидает начала работы',
  [DocumentStatus.CREATION]: 'Создание',
  [DocumentStatus.APPROVAL]: 'Утверждение',
  [DocumentStatus.SIGNATURE]: 'Подписание',
  [DocumentStatus.REGISTRATION]: 'Регистрация',
  [DocumentStatus.IN_PROGRESS]: 'В процессе',
  [DocumentStatus.COMPLETED]: 'Завершен'
};

