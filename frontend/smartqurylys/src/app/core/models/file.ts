export interface FileResponse {
  id: number;
  name: string;
  filepath: string; 
  size: number;     
  userFullName?: string;
  createdAt: string; 
}