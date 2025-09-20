import { ParticipantResponse } from "../models/participant";
import { FileResponse } from "../models/file";
import { RequirementResponse, CreateRequirementRequest, UpdateRequirementRequest} from "../models/requirement";
export interface TaskResponse {
  id: number;
  stageId: number; 
  name: string;
  description?: string;
  info?: string;
  responsiblePersons: ParticipantResponse[]; 
  startDate?: string;
  endDate?: string;
  isPriority: boolean;
  executionRequested: boolean;
  executionConfirmed: boolean; 
  dependsOnTaskIds?: number[];
  dependsOnTasks?: TaskResponse[];
  files?: FileResponse[];
  requirements?: RequirementResponse[];
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  responsiblePersonIds?: number[]; 
  info?: string;
  isPriority?: boolean;
  executionRequested?: boolean;
  executed?: boolean;
  dependsOnTaskIds?: number[];
  requirements: CreateRequirementRequest[];
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  responsiblePersonIds?: number[]; 
  info?: string;
  isPriority?: boolean;
  executionRequested?: boolean;
  executed?: boolean; 
  dependsOnTaskIds?: number[];
  requirements?: UpdateRequirementRequest[];
}