import { ParticipantResponse } from "../models/participant";
import { FileResponse } from "../models/file";
export interface TaskDependency {
  id: number;
  name: string;
}

export interface TaskResponse {
  id: number;
  stageId: number;
  name: string;
  responsiblePerson?: ParticipantResponse; // Объект участника
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  info?: string;
  description?: string;
  isPriority: boolean;
  executionRequested: boolean;
  executed: boolean;
  dependsOn?: TaskResponse[]; 
  files?: FileResponse[];
  

  responsiblePersonId?: number | null; 
  dependsOnTaskIds?: number[]; 
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  responsiblePersonId?: number | null; 
  info?: string;
  isPriority?: boolean;
  executionRequested?: boolean;
  executed?: boolean;
  dependsOnTaskIds?: number[]; 
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  responsiblePersonId?: number | null; 
  info?: string;
  isPriority?: boolean;
  executionRequested?: boolean;
  executed?: boolean;
  dependsOnTaskIds?: number[]; 
}
