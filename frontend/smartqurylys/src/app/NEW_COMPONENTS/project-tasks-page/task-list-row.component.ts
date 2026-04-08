import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { TodoPriority, TodoRowItem, TodoStatus } from './task-list.models';

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
  selector: 'tr[app-task-list-row]',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'task-row',
    '[class.subtask-row]': 'item.level > 0',
    '[class.selected-row]': 'item.selected'
  },
  templateUrl: './task-list-row.component.html',
  styleUrl: './task-list-row.component.css'
})
export class TaskListRowComponent {
  @ViewChild('titleInput') titleInput?: ElementRef<HTMLInputElement>;
  @Input({ required: true }) item!: TodoRowItem;
  @Input() isStatusMenuOpen = false;
  @Input() isPriorityMenuOpen = false;
  @Input() isDateMenuOpen = false;
  @Input() availableStatuses: TodoStatus[] = [];
  @Input() availablePriorities: TodoPriority[] = [];
  @Input() weekdayLabels: string[] = [];
  @Input() calendarMonthLabel = '';
  @Input() calendarWeeks: CalendarDay[][] = [];
  @Input() statusMenuTop = 0;
  @Input() statusMenuLeft = 0;
  @Input() priorityMenuTop = 0;
  @Input() priorityMenuLeft = 0;
  @Input() dateMenuTop = 0;
  @Input() dateMenuLeft = 0;
  @Input() isEditingTitle = false;
  @Input() editingTitleValue = '';
  @Output() toggleExpanded = new EventEmitter<number>();
  @Output() toggleSelected = new EventEmitter<number>();
  @Output() toggleStatusMenu = new EventEmitter<{ itemId: number; anchorRect: OverlayAnchorRect }>();
  @Output() togglePriorityMenu = new EventEmitter<{ itemId: number; anchorRect: OverlayAnchorRect }>();
  @Output() toggleDateMenu = new EventEmitter<{ itemId: number; anchorRect: OverlayAnchorRect }>();
  @Output() changeStatus = new EventEmitter<{ itemId: number; status: TodoStatus }>();
  @Output() changePriority = new EventEmitter<{ itemId: number; priority: TodoPriority }>();
  @Output() previousMonth = new EventEmitter<void>();
  @Output() nextMonth = new EventEmitter<void>();
  @Output() changeDueDate = new EventEmitter<{ itemId: number; isoDate: string }>();
  @Output() clearDueDate = new EventEmitter<number>();
  @Output() addSubtask = new EventEmitter<number>();
  @Output() startTitleEdit = new EventEmitter<number>();
  @Output() titleDraftChange = new EventEmitter<{ itemId: number; value: string }>();
  @Output() saveTitleEdit = new EventEmitter<number>();
  @Output() cancelTitleEdit = new EventEmitter<number>();
  private shouldFocusTitleInput = false;

  readonly statusClassMap: Record<TodoStatus, string> = {
    'To do': 'status-todo',
    Idea: 'status-idea',
    'In progress': 'status-progress',
    'In review': 'status-review',
    Done: 'status-done',
    Blocked: 'status-blocked'
  };

  readonly priorityClassMap: Record<TodoPriority, string> = {
    Low: 'priority-low',
    Medium: 'priority-medium',
    High: 'priority-high',
    Critical: 'priority-critical'
  };

  get hasChildren(): boolean {
    return this.item.type === 'group' && !!this.item.subtasks?.length;
  }

  get statusClass(): string {
    return this.statusClassMap[this.item.status];
  }

  get priorityClass(): string {
    return this.item.priority
      ? this.priorityClassMap[this.item.priority]
      : 'priority-none';
  }

  ngAfterViewChecked(): void {
    if (!this.shouldFocusTitleInput || !this.titleInput) {
      return;
    }

    const input = this.titleInput.nativeElement;
    const end = input.value.length;
    input.focus();
    input.setSelectionRange(end, end);
    input.scrollLeft = input.scrollWidth;
    this.shouldFocusTitleInput = false;
  }

  onToggleExpanded(event?: MouseEvent): void {
    event?.stopPropagation();

    if (this.hasChildren) {
      this.toggleExpanded.emit(this.item.id);
    }
  }

  onToggleSelected(): void {
    this.toggleSelected.emit(this.item.id);
  }

  onToggleStatusMenu(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    this.toggleStatusMenu.emit({
      itemId: this.item.id,
      anchorRect: {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        width: rect.width,
        height: rect.height
      }
    });
  }

  onChangeStatus(status: TodoStatus): void {
    this.changeStatus.emit({
      itemId: this.item.id,
      status
    });
  }

  onTogglePriorityMenu(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    this.togglePriorityMenu.emit({
      itemId: this.item.id,
      anchorRect: {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        width: rect.width,
        height: rect.height
      }
    });
  }

  onChangePriority(priority: TodoPriority): void {
    this.changePriority.emit({
      itemId: this.item.id,
      priority
    });
  }

  onToggleDateMenu(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    this.toggleDateMenu.emit({
      itemId: this.item.id,
      anchorRect: {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        width: rect.width,
        height: rect.height
      }
    });
  }

  onPreviousMonth(): void {
    this.previousMonth.emit();
  }

  onNextMonth(): void {
    this.nextMonth.emit();
  }

  onChangeDueDate(isoDate: string): void {
    this.changeDueDate.emit({
      itemId: this.item.id,
      isoDate
    });
  }

  onClearDueDate(): void {
    this.clearDueDate.emit(this.item.id);
  }

  onAddSubtask(event: MouseEvent): void {
    event.stopPropagation();
    this.addSubtask.emit(this.item.id);
  }

  onAddSubtaskMouseDown(event: MouseEvent): void {
    event.preventDefault();
  }

  onStartTitleEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.shouldFocusTitleInput = true;
    this.startTitleEdit.emit(this.item.id);
  }

  onTitleInput(value: string): void {
    this.titleDraftChange.emit({
      itemId: this.item.id,
      value
    });
  }

  onTitleBlur(): void {
    this.saveTitleEdit.emit(this.item.id);
  }

  onTitleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveTitleEdit.emit(this.item.id);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelTitleEdit.emit(this.item.id);
    }
  }

  trackStatus(_: number, status: TodoStatus): TodoStatus {
    return status;
  }

  trackPriority(_: number, priority: TodoPriority): TodoPriority {
    return priority;
  }

  trackWeekday(_: number, label: string): string {
    return label;
  }

  trackDay(_: number, day: CalendarDay): string {
    return day.iso;
  }

  get selectedDateIso(): string {
    if (!this.item.dueDate) {
      return '';
    }

    const parsed = new Date(this.item.dueDate);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const year = parsed.getFullYear();
    const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const day = `${parsed.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
