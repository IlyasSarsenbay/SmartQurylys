import { FileResponse } from "./file";
import { StageResponse } from "./stage";
export interface ScheduleResponse {
  id: number;
  projectId: number; 
  name: string;
  createdAt: string; 
  stages: StageResponse[]; 
  files?: FileResponse[]; 
}

export interface CreateScheduleRequest {
  name: string;
}

export interface UpdateScheduleRequest extends CreateScheduleRequest {
}