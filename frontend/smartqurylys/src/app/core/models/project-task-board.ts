export type ProjectTaskBoardStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';

export type ProjectTaskBoardPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectTaskBoardUserSummaryResponse {
  id: number;
  fullName: string;
}

export interface ProjectTaskBoardAssigneeResponse {
  participantId: number;
  userId: number;
  fullName: string;
  role: string;
}

export interface ProjectTaskCommentResponse {
  id: number;
  taskId: number;
  message: string;
  author: ProjectTaskBoardUserSummaryResponse;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTaskBoardTaskResponse {
  id: number;
  stageId: number;
  parentTaskId: number | null;
  title: string;
  description: string | null;
  status: ProjectTaskBoardStatus;
  priority: ProjectTaskBoardPriority;
  dueDate: string | null;
  position: number;
  assignee: ProjectTaskBoardAssigneeResponse | null;
  createdBy: ProjectTaskBoardUserSummaryResponse | null;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  subtasks: ProjectTaskBoardTaskResponse[];
}

export interface ProjectTaskBoardStageResponse {
  id: number;
  name: string;
  position: number;
  taskCount: number;
  tasks: ProjectTaskBoardTaskResponse[];
}

export interface ProjectTaskBoardResponse {
  projectId: number;
  stages: ProjectTaskBoardStageResponse[];
}

export interface CreateProjectTaskBoardStageRequest {
  name: string;
}

export interface UpdateProjectTaskBoardStageRequest {
  name?: string;
  position?: number;
}

export interface CreateProjectTaskBoardTaskRequest {
  stageId: number;
  parentTaskId?: number | null;
  title: string;
}

export interface UpdateProjectTaskBoardTaskRequest {
  stageId?: number;
  parentTaskId?: number;
  clearParentTask?: boolean;
  title?: string;
  description?: string;
  status?: ProjectTaskBoardStatus;
  priority?: ProjectTaskBoardPriority;
  dueDate?: string;
  clearDueDate?: boolean;
  assigneeParticipantId?: number;
  clearAssignee?: boolean;
  position?: number;
}

export interface CreateProjectTaskCommentRequest {
  message: string;
}

export interface BulkDeleteProjectTaskBoardTasksRequest {
  taskIds: number[];
}
