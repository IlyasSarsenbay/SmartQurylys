import { ProjectStatus } from "../enums/project-status.enum"; // Убедитесь, что путь к enum правильный


export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  startDate: string; 
  endDate: string;   
  type: string;
  status: ProjectStatus; 
  cityName: string;
  ownerFullName: string;
}
