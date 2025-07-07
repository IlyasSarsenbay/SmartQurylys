import { ParticipantResponse } from "../models/participant";
import { FileResponse } from "../models/file";

export interface TaskResponse {
  id: number;
  stageId: number; 
  name: string;
  responsiblePerson?: ParticipantResponse; 
  startDate?: string; 
  endDate?: string;   
  info?: string;
  description?: string;
  isPriority: boolean;
  executionRequested: boolean;
  executed: boolean;
  dependsOn?: TaskResponse[]; 
  files?: FileResponse[]; 
}


export interface CreateTaskRequest {
  name: string;
  responsiblePersonId?: number; 
  startDate?: string;
  endDate?: string;
  info?: string;
  description?: string;
  isPriority?: boolean;
  executionRequested?: boolean;
  executed?: boolean;
  dependsOnTaskIds?: number[]; 
}

export interface UpdateTaskRequest extends CreateTaskRequest {
}