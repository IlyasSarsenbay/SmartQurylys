import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskListRowComponent } from './task-list-row.component';
import { TodoItem, TodoPriority, TodoRowItem, TodoStatus } from './task-list.models';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  currentMonth: boolean;
  iso: string;
}

interface OverlayAnchorRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-project-tasks-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskListRowComponent],
  templateUrl: './project-tasks-page.component.html',
  styleUrl: './project-tasks-page.component.css'
})
export class ProjectTasksPageComponent {
  searchTerm = '';
  selectedStatus: 'all' | TodoStatus = 'all';
  editingTitleItemId: number | null = null;
  editingTitleValue = '';
  openStatusMenuFor: number | null = null;
  openPriorityMenuFor: number | null = null;
  openDateMenuFor: number | null = null;
  statusMenuTop = 0;
  statusMenuLeft = 0;
  priorityMenuTop = 0;
  priorityMenuLeft = 0;
  dateMenuTop = 0;
  dateMenuLeft = 0;
  readonly statusOptions: TodoStatus[] = ['To do', 'Idea', 'In progress', 'In review', 'Done', 'Blocked'];
  readonly priorityOptions: TodoPriority[] = ['Low', 'Medium', 'High', 'Critical'];
  calendarViewDate = new Date(2026, 3, 1);
  readonly weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  readonly tasks: TodoItem[] = [
    {
      id: 1,
      type: 'task',
      title: 'Prepare project charter approval',
      status: 'To do',
      dueDate: '15 Apr 2026',
      priority: 'High',
      assignee: 'Aruzhan',
      commentsCount: 0,
      selected: false
    },
    {
      id: 2,
      type: 'group',
      title: 'Foundation work package',
      status: 'To do',
      dueDate: '22 Apr 2026',
      priority: 'Critical',
      assignee: 'Dias',
      commentsCount: 3,
      selected: false,
      expanded: true,
      subtasks: [
        {
          id: 21,
          type: 'task',
          title: 'Review reinforcement drawings',
          status: 'In progress',
          dueDate: '18 Apr 2026',
          priority: 'High',
          assignee: 'Madi',
          commentsCount: 2,
          selected: false
        },
        {
          id: 22,
          type: 'task',
          title: 'Confirm concrete delivery schedule',
          status: 'Done',
          dueDate: '19 Apr 2026',
          priority: 'Medium',
          assignee: 'Dana',
          commentsCount: 1,
          selected: false
        }
      ]
    },
    {
      id: 3,
      type: 'task',
      title: 'Approve safety induction checklist',
      status: 'Blocked',
      dueDate: '24 Apr 2026',
      priority: 'Medium',
      assignee: '',
      commentsCount: 0,
      selected: false
    }
  ];

  get visibleRows(): TodoRowItem[] {
    return this.flattenItems(this.filteredTasks);
  }

  get totalTasks(): number {
    return this.countItems(this.tasks);
  }

  get completedTasks(): number {
    return this.countDoneItems(this.tasks);
  }

  get groupCount(): number {
    return this.tasks.filter((task) => task.type === 'group').length;
  }

  get taskCount(): number {
    return this.totalTasks - this.groupCount;
  }

  get calendarMonthLabel(): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(this.calendarViewDate);
  }

  get calendarWeeks(): CalendarDay[][] {
    const monthStart = new Date(this.calendarViewDate.getFullYear(), this.calendarViewDate.getMonth(), 1);
    const monthEnd = new Date(this.calendarViewDate.getFullYear(), this.calendarViewDate.getMonth() + 1, 0);
    const startOffset = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - startOffset);

    const totalCells = 42;
    const days: CalendarDay[] = Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);

      return {
        date,
        dayNumber: date.getDate(),
        currentMonth: date >= monthStart && date <= monthEnd,
        iso: this.toIsoDate(date)
      };
    });

    return Array.from({ length: 6 }, (_, weekIndex) => days.slice(weekIndex * 7, weekIndex * 7 + 7));
  }

  get selectedCount(): number {
    return this.countSelectedItems(this.tasks);
  }

  get allVisibleSelected(): boolean {
    return this.visibleRows.length > 0 && this.visibleRows.every((item) => !!item.selected);
  }

  get someVisibleSelected(): boolean {
    return this.visibleRows.some((item) => !!item.selected) && !this.allVisibleSelected;
  }

  onStatusChange(status: 'all' | TodoStatus): void {
    this.selectedStatus = status;
  }

  onToggleExpanded(itemId: number): void {
    this.updateItemById(this.tasks, itemId, (item) => {
      item.expanded = !item.expanded;
    });
  }

  onToggleSelected(itemId: number): void {
    this.updateItemById(this.tasks, itemId, (item) => {
      item.selected = !item.selected;
    });
  }

  onStartTitleEdit(itemId: number): void {
    const item = this.findItemById(this.tasks, itemId);
    if (!item) {
      return;
    }

    this.editingTitleItemId = itemId;
    this.editingTitleValue = item.title;
  }

  onTitleDraftChange(payload: { itemId: number; value: string }): void {
    if (this.editingTitleItemId !== payload.itemId) {
      return;
    }

    this.editingTitleValue = payload.value;
  }

  onSaveTitleEdit(itemId: number): void {
    if (this.editingTitleItemId !== itemId) {
      return;
    }

    const trimmedValue = this.editingTitleValue.trim();

    if (trimmedValue) {
      this.updateItemById(this.tasks, itemId, (item) => {
        item.title = trimmedValue;
      });
    }

    this.editingTitleItemId = null;
    this.editingTitleValue = '';
  }

  onCancelTitleEdit(itemId: number): void {
    if (this.editingTitleItemId !== itemId) {
      return;
    }

    this.editingTitleItemId = null;
    this.editingTitleValue = '';
  }

  onAddSubtask(itemId: number): void {
    const nextId = this.getNextId(this.tasks);

    this.updateItemById(this.tasks, itemId, (item) => {
      const newSubtask: TodoItem = {
        id: nextId,
        type: 'task',
        title: 'New subtask',
        status: 'To do',
        dueDate: '',
        priority: 'Low',
        assignee: '',
        commentsCount: 0,
        selected: false
      };

      if (item.type === 'group') {
        item.subtasks = [...(item.subtasks ?? []), newSubtask];
        item.expanded = true;
        return;
      }

      item.type = 'group';
      item.subtasks = [newSubtask];
      item.expanded = true;
    });
  }

  onToggleSelectAll(checked: boolean): void {
    const visibleIds = new Set(this.visibleRows.map((item) => item.id));
    this.updateItems(this.tasks, (item) => {
      if (visibleIds.has(item.id)) {
        item.selected = checked;
      }
    });
  }

  onToggleStatusMenu(payload: { itemId: number; anchorRect: OverlayAnchorRect }): void {
    this.openPriorityMenuFor = null;
    this.openDateMenuFor = null;

    if (this.openStatusMenuFor === payload.itemId) {
      this.openStatusMenuFor = null;
      return;
    }

    this.openStatusMenuFor = payload.itemId;
    this.setOverlayPosition(payload.anchorRect, 220, 280, (top, left) => {
      this.statusMenuTop = top;
      this.statusMenuLeft = left;
    });
  }

  onChangeStatus(itemId: number, status: TodoStatus): void {
    this.updateItemById(this.tasks, itemId, (item) => {
      item.status = status;
    });
    this.openStatusMenuFor = null;
  }

  onTogglePriorityMenu(payload: { itemId: number; anchorRect: OverlayAnchorRect }): void {
    this.openStatusMenuFor = null;
    this.openDateMenuFor = null;

    if (this.openPriorityMenuFor === payload.itemId) {
      this.openPriorityMenuFor = null;
      return;
    }

    this.openPriorityMenuFor = payload.itemId;
    this.setOverlayPosition(payload.anchorRect, 220, 260, (top, left) => {
      this.priorityMenuTop = top;
      this.priorityMenuLeft = left;
    });
  }

  onChangePriority(itemId: number, priority: TodoPriority): void {
    this.updateItemById(this.tasks, itemId, (item) => {
      item.priority = priority;
    });
    this.openPriorityMenuFor = null;
  }

  onToggleDateMenu(payload: { itemId: number; anchorRect: OverlayAnchorRect }): void {
    this.openStatusMenuFor = null;
    this.openPriorityMenuFor = null;

    if (this.openDateMenuFor === payload.itemId) {
      this.openDateMenuFor = null;
      return;
    }

    this.openDateMenuFor = payload.itemId;
    this.setOverlayPosition(payload.anchorRect, 312, 360, (top, left) => {
      this.dateMenuTop = top;
      this.dateMenuLeft = left;
    });

    const item = this.findItemById(this.tasks, payload.itemId);
    this.calendarViewDate = this.parseDueDate(item?.dueDate) ?? new Date(2026, 3, 1);
    this.calendarViewDate = new Date(this.calendarViewDate.getFullYear(), this.calendarViewDate.getMonth(), 1);
  }

  onPreviousMonth(): void {
    this.calendarViewDate = new Date(
      this.calendarViewDate.getFullYear(),
      this.calendarViewDate.getMonth() - 1,
      1
    );
  }

  onNextMonth(): void {
    this.calendarViewDate = new Date(
      this.calendarViewDate.getFullYear(),
      this.calendarViewDate.getMonth() + 1,
      1
    );
  }

  onChangeDueDate(itemId: number, isoDate: string): void {
    this.updateItemById(this.tasks, itemId, (item) => {
      item.dueDate = this.formatDueDate(isoDate);
    });
    this.openDateMenuFor = null;
  }

  onClearDueDate(itemId: number): void {
    this.updateItemById(this.tasks, itemId, (item) => {
      item.dueDate = '';
    });
    this.openDateMenuFor = null;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.openDateMenuFor !== null) {
      this.openDateMenuFor = null;
    }
  }

  addTask(): void {
    const nextId = this.getNextId(this.tasks);

    this.tasks.unshift({
      id: nextId,
      type: 'task',
      title: 'New task',
      status: 'To do',
      dueDate: '',
      priority: 'Low',
      assignee: '',
      commentsCount: 0,
      selected: false
    });
  }

  deleteSelected(): void {
    const remainingTasks = this.removeSelectedItems(this.tasks);
    this.tasks.splice(0, this.tasks.length, ...remainingTasks);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.status-dropdown')) {
      this.openStatusMenuFor = null;
    }

    if (!target?.closest('.priority-dropdown')) {
      this.openPriorityMenuFor = null;
    }

    if (!target?.closest('.date-dropdown')) {
      this.openDateMenuFor = null;
    }
  }

  private get filteredTasks(): TodoItem[] {
    return this.tasks
      .map((item) => this.filterItem(item))
      .filter((item): item is TodoItem => item !== null);
  }

  private filterItem(item: TodoItem): TodoItem | null {
    const matchesSearch = this.matchesSearch(item);
    const matchesStatus = this.selectedStatus === 'all' || item.status === this.selectedStatus;
    const filteredSubtasks = item.subtasks
      ?.map((subtask) => this.filterItem(subtask))
      .filter((subtask): subtask is TodoItem => subtask !== null);

    if (item.type === 'group') {
      if (matchesSearch || matchesStatus || (filteredSubtasks?.length ?? 0) > 0) {
        return {
          ...item,
          subtasks: filteredSubtasks ?? item.subtasks
        };
      }

      return null;
    }

    return matchesSearch && matchesStatus ? { ...item } : null;
  }

  private matchesSearch(item: TodoItem): boolean {
    const query = this.searchTerm.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [
      item.title,
      item.status,
      item.priority ?? '',
      item.assignee ?? ''
    ].some((value) => value.toLowerCase().includes(query));
  }

  private flattenItems(items: TodoItem[], level = 0, parentId?: number): TodoRowItem[] {
    return items.flatMap((item) => {
      const row: TodoRowItem = {
        ...item,
        level,
        parentId
      };

      const subtasks = item.type === 'group' && item.expanded && item.subtasks?.length
        ? this.flattenItems(item.subtasks, level + 1, item.id)
        : [];

      return [row, ...subtasks];
    });
  }

  private updateItemById(items: TodoItem[], itemId: number, updater: (item: TodoItem) => void): boolean {
    for (const item of items) {
      if (item.id === itemId) {
        updater(item);
        return true;
      }

      if (item.subtasks?.length && this.updateItemById(item.subtasks, itemId, updater)) {
        return true;
      }
    }

    return false;
  }

  private updateItems(items: TodoItem[], updater: (item: TodoItem) => void): void {
    for (const item of items) {
      updater(item);

      if (item.subtasks?.length) {
        this.updateItems(item.subtasks, updater);
      }
    }
  }

  private countItems(items: TodoItem[]): number {
    return items.reduce((count, item) => count + 1 + this.countItems(item.subtasks ?? []), 0);
  }

  private countDoneItems(items: TodoItem[]): number {
    return items.reduce((count, item) => {
      const doneCount = item.status === 'Done' ? 1 : 0;
      return count + doneCount + this.countDoneItems(item.subtasks ?? []);
    }, 0);
  }

  private countSelectedItems(items: TodoItem[]): number {
    return items.reduce((count, item) => {
      const selectedCount = item.selected ? 1 : 0;
      return count + selectedCount + this.countSelectedItems(item.subtasks ?? []);
    }, 0);
  }

  private getNextId(items: TodoItem[]): number {
    return items.reduce((highestId, item) => {
      const childMax = item.subtasks?.length ? this.getNextId(item.subtasks) : 0;
      return Math.max(highestId, item.id, childMax);
    }, 0) + 1;
  }

  private findItemById(items: TodoItem[], itemId: number): TodoItem | null {
    for (const item of items) {
      if (item.id === itemId) {
        return item;
      }

      const foundChild = item.subtasks?.length ? this.findItemById(item.subtasks, itemId) : null;
      if (foundChild) {
        return foundChild;
      }
    }

    return null;
  }

  private parseDueDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatDueDate(isoDate: string): string {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private setDateMenuPosition(anchorRect: OverlayAnchorRect): void {
    this.setOverlayPosition(anchorRect, 312, 360, (top, left) => {
      this.dateMenuTop = top;
      this.dateMenuLeft = left;
    });
  }

  private setOverlayPosition(
    anchorRect: OverlayAnchorRect,
    menuWidth: number,
    menuHeight: number,
    apply: (top: number, left: number) => void
  ): void {
    const gutter = 12;

    const preferredLeft = anchorRect.left;
    const maxLeft = Math.max(gutter, window.innerWidth - menuWidth - gutter);
    const left = Math.min(Math.max(preferredLeft, gutter), maxLeft);

    const belowTop = anchorRect.bottom + 8;
    const aboveTop = anchorRect.top - menuHeight - 8;
    const canFitBelow = belowTop + menuHeight <= window.innerHeight - gutter;

    const top = canFitBelow
      ? belowTop
      : Math.max(gutter, aboveTop);

    apply(top, left);
  }

  private removeSelectedItems(items: TodoItem[]): TodoItem[] {
    return items.reduce<TodoItem[]>((acc, item) => {
      if (item.selected) {
        return acc;
      }

      const nextSubtasks = item.subtasks?.length
        ? this.removeSelectedItems(item.subtasks)
        : item.subtasks;

      acc.push({
        ...item,
        subtasks: nextSubtasks
      });

      return acc;
    }, []);
  }
}
