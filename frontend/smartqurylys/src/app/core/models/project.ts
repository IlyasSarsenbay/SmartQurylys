import { ProjectStatus } from "../enums/project-status.enum"; 
import { ScheduleResponse } from "./schedule";

export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  startDate: string; 
  endDate: string;   
  type: string;
  status: ProjectStatus; 
  cityName: string;
  ownerIinBin: string;
  ownerName: string;
  schedule: ScheduleResponse;
  timeRemaining?: { days?: number; hours?: number; isExpired: boolean; expiredDate?: string; }; // Обновленное свойство
}
