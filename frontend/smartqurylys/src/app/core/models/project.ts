import { ProjectStatus } from "../enums/project-status.enum"; 


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
}
