import { ProjectStatus } from "../enums/project-status.enum"; 
import { ScheduleResponse } from "./schedule";

export function mapProjectResponseToProject(
  response: ProjectResponse
): Project {
  return {
    id: response.id,
    name: response.name,
    description: response.description,
    startDate: response.startDate,
    endDate: response.endDate,
    type: response.type,
    status: response.status,
    cityName: response.cityName,
    ownerIinBin: response.ownerIinBin,
    ownerName: response.ownerName,
    schedule: response.schedule,
    timeRemaining: response.timeRemaining,
    favorite: false
  };
}

export function mapProjectResponsesToProjects(
  responses: ProjectResponse[]
): Project[] {
  return responses.map(mapProjectResponseToProject);
}

export const PROJECT_STATUS_RU: Record<string, string> = {
  DRAFT: 'Новый',
  WAITING: 'Ожидание',
  ACTIVE: 'Активный',
  ON_PAUSE: 'На паузе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён'
};


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

export interface Project {
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
  timeRemaining?: { days?: number; hours?: number; isExpired: boolean; expiredDate?: string; };
  favorite: boolean;
}
