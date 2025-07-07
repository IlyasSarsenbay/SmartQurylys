import { ProjectStatus } from "../enums/project-status.enum";

export interface CreateProjectRequest {
  name: string;
  description: string;
  type: string;
  cityId: number; 
  startDate: string; 
  endDate: string;   
}

export interface UpdateProjectRequest {
  name?: string; 
  description?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: ProjectStatus; 
  cityId?: number;
}


export interface CreateInvitationRequest {
  iinBin: string;
  role: string;
  canUploadDocuments: boolean;
  canSendNotifications: boolean;
}