
import { StageStatus } from "../enums/stage-status.enum";
import { TaskResponse } from "./task";

export interface StageResponse {
  id: number;
  scheduleId: number; 
  name: string;
  description?: string;
  startDate?: string; 
  endDate?: string;   
  status: StageStatus;
  tasks: TaskResponse[]; 
  expanded?: boolean;
}

export interface CreateStageRequest {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: StageStatus;
}

export interface UpdateStageRequest extends CreateStageRequest {
}
