import { FileResponse } from "./file";

export interface RequirementResponse {
  id: number;
  description: string;
  sampleFile: FileResponse;
}

export interface CreateRequirementRequest {
  description: string;
  tempFileId: string;
}

export interface UpdateRequirementRequest {
  description?: string;
  removeSampleFile?: boolean;
  newSampleFileTempId?: string;
}