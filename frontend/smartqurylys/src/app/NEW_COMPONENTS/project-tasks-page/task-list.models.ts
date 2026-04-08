export type TodoItemType = 'task' | 'group';

export type TodoStatus = 'To do' | 'Idea' | 'In progress' | 'In review' | 'Done' | 'Blocked';

export type TodoPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TodoComment {
  id: number;
  author: string;
  message: string;
  createdAt: string;
}

export interface TodoItem {
  id: number;
  type: TodoItemType;
  title: string;
  description?: string;
  status: TodoStatus;
  dueDate?: string;
  priority?: TodoPriority;
  assignee?: string;
  assigneeParticipantId?: number | null;
  commentsCount: number;
  selected?: boolean;
  expanded?: boolean;
  subtasks?: TodoItem[];
}

export interface TodoRowItem extends TodoItem {
  level: number;
  parentId?: number;
}
