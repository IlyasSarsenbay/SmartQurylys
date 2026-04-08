export type TodoItemType = 'task' | 'group';

export type TodoStatus = 'To do' | 'Idea' | 'In progress' | 'In review' | 'Done' | 'Blocked';

export type TodoPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TodoItem {
  id: number;
  type: TodoItemType;
  title: string;
  status: TodoStatus;
  dueDate?: string;
  priority?: TodoPriority;
  assignee?: string;
  commentsCount: number;
  selected?: boolean;
  expanded?: boolean;
  subtasks?: TodoItem[];
}

export interface TodoRowItem extends TodoItem {
  level: number;
  parentId?: number;
}
