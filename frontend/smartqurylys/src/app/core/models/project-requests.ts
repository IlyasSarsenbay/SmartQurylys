import { ProjectStatus } from "../enums/project-status.enum";
import { Project } from "./project";

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

export interface UpdateParticipantRequest {
  role?: string;
  canUploadDocuments?: boolean;
  canSendNotifications?: boolean;
}

export function mapToUpdateProjectRequest(project: Project): UpdateProjectRequest {
  return {
    name: project.name,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    type: project.type,
    status: project.status,
    cityId: project.cityId
  }
}