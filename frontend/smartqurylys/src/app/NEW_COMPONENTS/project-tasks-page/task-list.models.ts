export type TodoItemType = 'task' | 'group';

export type TodoStatus =
  | 'К выполнению'
  | 'В работе'
  | 'На проверке'
  | 'Возвращено на доработку'
  | 'Готово'
  | 'Заблокировано';

export type TodoPriority = 'Низкий' | 'Средний' | 'Высокий' | 'Критический';

export type TodoCompletionStatus = 'none' | 'pending' | 'approved' | 'rejected';

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
  assigneeUserId?: number | null;
  completionStatus: TodoCompletionStatus;
  completionRequestedBy?: string;
  completionRequestedAt?: string;
  completionReviewedBy?: string;
  completionReviewedAt?: string;
  completionReviewReason?: string;
  commentsCount: number;
  selected?: boolean;
  expanded?: boolean;
  subtasks?: TodoItem[];
}

export interface TodoRowItem extends TodoItem {
  level: number;
  parentId?: number;
}
