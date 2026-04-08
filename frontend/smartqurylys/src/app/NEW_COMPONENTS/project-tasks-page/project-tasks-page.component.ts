import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Participant } from '../../core/models/participant';
import {
  ProjectTaskBoardPriority,
  ProjectTaskBoardResponse,
  ProjectTaskBoardStatus,
  ProjectTaskBoardTaskResponse,
  ProjectTaskCommentResponse
} from '../../core/models/project-task-board';
import { ParticipantService } from '../../core/participant.service';
import { ProjectTaskBoardService } from '../../core/project-task-board.service';
import { TaskListRowComponent } from './task-list-row.component';
import { TodoComment, TodoItem, TodoPriority, TodoRowItem, TodoStatus } from './task-list.models';

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

type SortColumn = 'subject' | 'status' | 'dueDate' | 'priority' | 'assignee';
type SortDirection = 'asc' | 'desc';

interface TaskStage {
  id: number;
  title: string;
  expanded: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  tasks: TodoItem[];
}

interface VisibleTaskStage extends TaskStage {
  rows: TodoRowItem[];
}

@Component({
  selector: 'app-project-tasks-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskListRowComponent],
  templateUrl: './project-tasks-page.component.html',
  styleUrl: './project-tasks-page.component.css'
})
export class ProjectTasksPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  searchTerm = '';
  selectedStatus: 'all' | TodoStatus = 'all';
  editingTitleItemId: number | null = null;
  editingTitleValue = '';
  editingStageId: number | null = null;
  editingStageValue = '';
  openStatusMenuFor: number | null = null;
  openPriorityMenuFor: number | null = null;
  openDateMenuFor: number | null = null;
  openAssigneeMenuFor: number | null = null;
  openStageMenuFor: number | null = null;
  commentsTaskId: number | null = null;
  commentDraft = '';
  statusMenuTop = 0;
  statusMenuLeft = 0;
  priorityMenuTop = 0;
  priorityMenuLeft = 0;
  dateMenuTop = 0;
  dateMenuLeft = 0;
  assigneeMenuTop = 0;
  assigneeMenuLeft = 0;
  readonly statusOptions: TodoStatus[] = ['To do', 'Idea', 'In progress', 'In review', 'Done', 'Blocked'];
  readonly priorityOptions: TodoPriority[] = ['Low', 'Medium', 'High', 'Critical'];
  calendarViewDate = new Date();
  readonly weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  projectParticipants: Participant[] = [];
  commentsByTaskId: Record<number, TodoComment[]> = {};
  stages: TaskStage[] = [];
  isLoading = false;
  private projectId: number | null = null;

  get visibleStages(): VisibleTaskStage[] {
    return this.stages
      .map((stage) => {
        const filteredTasks = this.filterAndSortStageTasks(stage.tasks);

        if (!filteredTasks.length && this.hasActiveStageFilters()) {
          return null;
        }

        return {
          ...stage,
          tasks: filteredTasks,
          rows: stage.expanded ? this.flattenItems(filteredTasks) : []
        };
      })
      .filter((stage): stage is VisibleTaskStage => stage !== null);
  }

  get visibleRows(): TodoRowItem[] {
    return this.visibleStages.flatMap((stage) => stage.rows);
  }

  get totalTasks(): number {
    return this.countItems(this.getAllTasks());
  }

  get completedTasks(): number {
    return this.countDoneItems(this.getAllTasks());
  }

  get groupCount(): number {
    return this.countGroups(this.getAllTasks());
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
    return this.countSelectedItems(this.getAllTasks());
  }

  get allVisibleSelected(): boolean {
    return this.visibleRows.length > 0 && this.visibleRows.every((item) => !!item.selected);
  }

  get someVisibleSelected(): boolean {
    return this.visibleRows.some((item) => !!item.selected) && !this.allVisibleSelected;
  }

  get activeCommentsTask(): TodoItem | null {
    return this.commentsTaskId === null ? null : this.findItemById(this.getAllTasks(), this.commentsTaskId);
  }

  get activeComments(): TodoComment[] {
    if (this.commentsTaskId === null) {
      return [];
    }

    return this.commentsByTaskId[this.commentsTaskId] ?? [];
  }

  isAllStageRowsSelected(stageId: number): boolean {
    const stage = this.visibleStages.find((item) => item.id === stageId);
    return !!stage && stage.rows.length > 0 && stage.rows.every((item) => !!item.selected);
  }

  isSomeStageRowsSelected(stageId: number): boolean {
    const stage = this.visibleStages.find((item) => item.id === stageId);
    return !!stage && stage.rows.some((item) => !!item.selected) && !this.isAllStageRowsSelected(stageId);
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly participantService: ParticipantService,
    private readonly projectTaskBoardService: ProjectTaskBoardService
  ) {}

  ngOnInit(): void {
    const projectId = Number(this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(projectId)) {
      return;
    }

    this.projectId = projectId;
    this.loadBoard();
    this.loadProjectParticipants();

    this.participantService.participantsChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((changedProjectId) => {
        if (this.projectId === null) {
          return;
        }

        if (changedProjectId === null || changedProjectId === this.projectId) {
          this.loadProjectParticipants(true);
        }
      });
  }

  onStatusChange(status: 'all' | TodoStatus): void {
    this.selectedStatus = status;
  }

  onSort(stageId: number, column: SortColumn): void {
    const stage = this.stages.find((item) => item.id === stageId);

    if (!stage) {
      return;
    }

    if (stage.sortColumn === column) {
      stage.sortDirection = stage.sortDirection === 'asc' ? 'desc' : 'asc';
      this.collapseTaskGroups(stage.tasks);
      return;
    }

    stage.sortColumn = column;
    stage.sortDirection = 'asc';
    this.collapseTaskGroups(stage.tasks);
  }

  isSortedBy(stageId: number, column: SortColumn): boolean {
    const stage = this.stages.find((item) => item.id === stageId);
    return stage?.sortColumn === column;
  }

  onToggleStageExpanded(stageId: number): void {
    if (this.editingStageId === stageId) {
      return;
    }

    const stage = this.stages.find((item) => item.id === stageId);
    if (stage) {
      stage.expanded = !stage.expanded;
    }
  }

  onToggleStageMenu(stageId: number): void {
    this.openStageMenuFor = this.openStageMenuFor === stageId ? null : stageId;
  }

  onRenameStage(stageId: number): void {
    const stage = this.stages.find((item) => item.id === stageId);
    if (!stage) {
      return;
    }

    this.startStageTitleEdit(stageId, stage.title);
    this.openStageMenuFor = null;
  }

  onDeleteStage(stageId: number): void {
    if (this.projectId === null) {
      return;
    }

    this.projectTaskBoardService.deleteStage(this.projectId, stageId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.openStageMenuFor = null;
          this.loadBoard();
        },
        error: (error) => {
          console.error('Failed to delete stage:', error);
        }
      });
  }

  onStageTitleInput(value: string): void {
    this.editingStageValue = value;
  }

  onSaveStageTitle(stageId: number): void {
    if (this.projectId === null || this.editingStageId !== stageId) {
      return;
    }

    const nextTitle = this.editingStageValue.trim();
    if (!nextTitle) {
      this.onCancelStageTitle(stageId);
      return;
    }

    this.editingStageId = null;
    this.editingStageValue = '';

    this.projectTaskBoardService.updateStage(this.projectId, stageId, { name: nextTitle })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadBoard();
        },
        error: (error) => {
          console.error('Failed to rename stage:', error);
        }
      });
  }

  onCancelStageTitle(stageId: number): void {
    if (this.editingStageId !== stageId) {
      return;
    }

    this.editingStageId = null;
    this.editingStageValue = '';
  }

  onStageTitleKeydown(event: KeyboardEvent, stageId: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSaveStageTitle(stageId);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancelStageTitle(stageId);
    }
  }

  onToggleExpanded(itemId: number): void {
    this.updateItemById(this.getAllTasks(), itemId, (item) => {
      item.expanded = !item.expanded;
    });
  }

  onToggleSelected(itemId: number): void {
    this.updateItemById(this.getAllTasks(), itemId, (item) => {
      item.selected = !item.selected;
    });
  }

  onStartTitleEdit(itemId: number): void {
    const item = this.findItemById(this.getAllTasks(), itemId);
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
    if (this.projectId === null || this.editingTitleItemId !== itemId) {
      return;
    }

    const trimmedValue = this.editingTitleValue.trim();
    this.editingTitleItemId = null;
    this.editingTitleValue = '';

    if (!trimmedValue) {
      return;
    }

    this.projectTaskBoardService.updateTask(this.projectId, itemId, { title: trimmedValue })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadBoard();
        },
        error: (error) => {
          console.error('Failed to rename task:', error);
        }
      });
  }

  onCancelTitleEdit(itemId: number): void {
    if (this.editingTitleItemId !== itemId) {
      return;
    }

    this.editingTitleItemId = null;
    this.editingTitleValue = '';
  }

  onAddSubtask(itemId: number): void {
    if (this.projectId === null) {
      return;
    }

    const stageId = this.findStageIdForTask(itemId);
    if (stageId === null) {
      return;
    }

    this.updateItemById(this.getAllTasks(), itemId, (item) => {
      item.expanded = true;
    });

    this.projectTaskBoardService.createTask(this.projectId, {
      stageId,
      parentTaskId: itemId,
      title: 'New subtask'
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task) => {
          this.loadBoard({ focusTaskId: task.id });
        },
        error: (error) => {
          console.error('Failed to create subtask:', error);
        }
      });
  }

  onToggleSelectAll(checked: boolean): void {
    const visibleIds = new Set(this.visibleRows.map((item) => item.id));
    this.updateItems(this.getAllTasks(), (item) => {
      if (visibleIds.has(item.id)) {
        item.selected = checked;
      }
    });
  }

  onToggleStageSelectAll(stageId: number, checked: boolean): void {
    const stage = this.visibleStages.find((item) => item.id === stageId);
    if (!stage) {
      return;
    }

    const visibleIds = new Set(stage.rows.map((item) => item.id));
    this.updateItems(stage.tasks, (item) => {
      if (visibleIds.has(item.id)) {
        item.selected = checked;
      }
    });
  }

  onToggleStatusMenu(payload: { itemId: number; anchorRect: OverlayAnchorRect }): void {
    this.openPriorityMenuFor = null;
    this.openDateMenuFor = null;
    this.openAssigneeMenuFor = null;

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
    if (this.projectId === null) {
      return;
    }

    this.projectTaskBoardService.updateTask(this.projectId, itemId, {
      status: this.toApiStatus(status)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updateItemById(this.getAllTasks(), itemId, (item) => {
            item.status = status;
          });
          this.openStatusMenuFor = null;
        },
        error: (error) => {
          console.error('Failed to update task status:', error);
        }
      });
  }

  onTogglePriorityMenu(payload: { itemId: number; anchorRect: OverlayAnchorRect }): void {
    this.openStatusMenuFor = null;
    this.openDateMenuFor = null;
    this.openAssigneeMenuFor = null;

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
    if (this.projectId === null) {
      return;
    }

    this.projectTaskBoardService.updateTask(this.projectId, itemId, {
      priority: this.toApiPriority(priority)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updateItemById(this.getAllTasks(), itemId, (item) => {
            item.priority = priority;
          });
          this.openPriorityMenuFor = null;
        },
        error: (error) => {
          console.error('Failed to update task priority:', error);
        }
      });
  }

  onToggleDateMenu(payload: { itemId: number; anchorRect: OverlayAnchorRect }): void {
    this.openStatusMenuFor = null;
    this.openPriorityMenuFor = null;
    this.openAssigneeMenuFor = null;

    if (this.openDateMenuFor === payload.itemId) {
      this.openDateMenuFor = null;
      return;
    }

    this.openDateMenuFor = payload.itemId;
    this.setOverlayPosition(payload.anchorRect, 312, 360, (top, left) => {
      this.dateMenuTop = top;
      this.dateMenuLeft = left;
    });

    const item = this.findItemById(this.getAllTasks(), payload.itemId);
    this.calendarViewDate = this.parseDueDate(item?.dueDate) ?? new Date();
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
    if (this.projectId === null) {
      return;
    }

    this.projectTaskBoardService.updateTask(this.projectId, itemId, { dueDate: isoDate })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updateItemById(this.getAllTasks(), itemId, (item) => {
            item.dueDate = this.formatDueDate(isoDate);
          });
          this.openDateMenuFor = null;
        },
        error: (error) => {
          console.error('Failed to update due date:', error);
        }
      });
  }

  onClearDueDate(itemId: number): void {
    if (this.projectId === null) {
      return;
    }

    this.projectTaskBoardService.updateTask(this.projectId, itemId, { clearDueDate: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updateItemById(this.getAllTasks(), itemId, (item) => {
            item.dueDate = '';
          });
          this.openDateMenuFor = null;
        },
        error: (error) => {
          console.error('Failed to clear due date:', error);
        }
      });
  }

  onToggleAssigneeMenu(payload: { itemId: number; anchorRect: OverlayAnchorRect }): void {
    this.openStatusMenuFor = null;
    this.openPriorityMenuFor = null;
    this.openDateMenuFor = null;

    if (this.openAssigneeMenuFor === payload.itemId) {
      this.openAssigneeMenuFor = null;
      return;
    }

    this.openAssigneeMenuFor = payload.itemId;
    this.setOverlayPosition(payload.anchorRect, 260, this.getAssigneeMenuHeight(), (top, left) => {
      this.assigneeMenuTop = top;
      this.assigneeMenuLeft = left;
    });
  }

  onChangeAssignee(itemId: number, assigneeParticipantId: number | null): void {
    if (this.projectId === null) {
      return;
    }

    this.projectTaskBoardService.updateTask(this.projectId, itemId, assigneeParticipantId === null
      ? { clearAssignee: true }
      : { assigneeParticipantId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const participant = assigneeParticipantId === null
            ? null
            : this.projectParticipants.find((item) => item.id === assigneeParticipantId) ?? null;

          this.updateItemById(this.getAllTasks(), itemId, (item) => {
            item.assigneeParticipantId = assigneeParticipantId;
            item.assignee = participant?.fullName ?? '';
          });
          this.openAssigneeMenuFor = null;
        },
        error: (error) => {
          console.error('Failed to update assignee:', error);
        }
      });
  }

  onOpenComments(itemId: number): void {
    this.commentsTaskId = itemId;
    this.commentDraft = '';
    this.loadComments(itemId);
  }

  onCloseComments(): void {
    this.commentsTaskId = null;
    this.commentDraft = '';
  }

  onSendComment(): void {
    if (this.projectId === null || this.commentsTaskId === null) {
      return;
    }

    const message = this.commentDraft.trim();
    if (!message) {
      return;
    }

    const taskId = this.commentsTaskId;
    this.projectTaskBoardService.addComment(this.projectId, taskId, { message })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comment) => {
          const mappedComment = this.mapComment(comment);
          const existingComments = this.commentsByTaskId[taskId] ?? [];
          this.commentsByTaskId[taskId] = [...existingComments, mappedComment];

          this.updateItemById(this.getAllTasks(), taskId, (item) => {
            item.commentsCount = existingComments.length + 1;
          });

          this.commentDraft = '';
        },
        error: (error) => {
          console.error('Failed to add comment:', error);
        }
      });
  }

  onCommentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendComment();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.openDateMenuFor = null;
    this.openStatusMenuFor = null;
    this.openPriorityMenuFor = null;
    this.openAssigneeMenuFor = null;
  }

  addTask(): void {
    const targetStage = this.stages[this.stages.length - 1];
    if (!targetStage) {
      return;
    }

    this.addTaskToStage(targetStage.id);
  }

  addStage(): void {
    if (this.projectId === null) {
      return;
    }

    this.projectTaskBoardService.createStage(this.projectId, { name: `New stage ${this.stages.length + 1}` })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stage) => {
          this.loadBoard({ focusStageId: stage.id });
        },
        error: (error) => {
          console.error('Failed to create stage:', error);
        }
      });
  }

  addTaskToStage(stageId: number): void {
    if (this.projectId === null) {
      return;
    }

    this.projectTaskBoardService.createTask(this.projectId, {
      stageId,
      title: 'New task'
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task) => {
          this.loadBoard({ focusTaskId: task.id });
        },
        error: (error) => {
          console.error('Failed to create task:', error);
        }
      });
  }

  deleteSelected(): void {
    if (this.projectId === null) {
      return;
    }

    const taskIds = this.collectSelectedIds(this.getAllTasks());
    if (!taskIds.length) {
      return;
    }

    this.projectTaskBoardService.bulkDeleteTasks(this.projectId, { taskIds })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.commentsTaskId !== null && taskIds.includes(this.commentsTaskId)) {
            this.onCloseComments();
          }
          this.loadBoard();
        },
        error: (error) => {
          console.error('Failed to delete selected tasks:', error);
        }
      });
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

    if (!target?.closest('.assignee-dropdown')) {
      this.openAssigneeMenuFor = null;
    }

    if (!target?.closest('.stage-actions')) {
      this.openStageMenuFor = null;
    }
  }

  private loadProjectParticipants(forceRefresh = false): void {
    if (this.projectId === null) {
      return;
    }

    this.participantService.getProjectParticipants(this.projectId, forceRefresh)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (participants) => {
          this.projectParticipants = participants;
        },
        error: (error) => {
          console.error('Failed to load project participants for tasks page:', error);
        }
      });
  }

  private loadBoard(options?: { focusTaskId?: number; focusStageId?: number }): void {
    if (this.projectId === null) {
      return;
    }

    this.isLoading = true;

    this.projectTaskBoardService.getBoard(this.projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (board) => {
          this.applyBoard(board, options);
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Failed to load project task board:', error);
        }
      });
  }

  private applyBoard(board: ProjectTaskBoardResponse, options?: { focusTaskId?: number; focusStageId?: number }): void {
    const previousStageState = new Map(this.stages.map((stage) => [stage.id, stage]));
    const itemState = this.collectItemState(this.getAllTasks());

    this.stages = board.stages
      .slice()
      .sort((left, right) => left.position - right.position || left.id - right.id)
      .map((stage) => {
        const previousStage = previousStageState.get(stage.id);
        return {
          id: stage.id,
          title: stage.name,
          expanded: previousStage?.expanded ?? true,
          sortColumn: previousStage?.sortColumn ?? 'subject',
          sortDirection: previousStage?.sortDirection ?? 'asc',
          tasks: this.mapBoardTasks(stage.tasks, itemState)
        };
      });

    if (options?.focusTaskId) {
      const item = this.findItemById(this.getAllTasks(), options.focusTaskId);
      if (item) {
        this.editingTitleItemId = item.id;
        this.editingTitleValue = item.title;
      }
    }

    if (options?.focusStageId) {
      const stage = this.stages.find((item) => item.id === options.focusStageId);
      if (stage) {
        this.startStageTitleEdit(stage.id, stage.title);
      }
    }

    if (this.commentsTaskId !== null) {
      const activeTask = this.findItemById(this.getAllTasks(), this.commentsTaskId);
      if (!activeTask) {
        this.onCloseComments();
      } else {
        this.loadComments(this.commentsTaskId);
      }
    }
  }

  private loadComments(taskId: number): void {
    if (this.projectId === null) {
      return;
    }

    this.projectTaskBoardService.getComments(this.projectId, taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments) => {
          this.commentsByTaskId[taskId] = comments.map((comment) => this.mapComment(comment));
        },
        error: (error) => {
          console.error('Failed to load comments:', error);
        }
      });
  }

  private mapBoardTasks(
    tasks: ProjectTaskBoardTaskResponse[],
    itemState: Map<number, { selected: boolean; expanded: boolean }>
  ): TodoItem[] {
    return tasks
      .slice()
      .sort((left, right) => left.position - right.position || left.id - right.id)
      .map((task) => {
        const mappedSubtasks = this.mapBoardTasks(task.subtasks ?? [], itemState);
        const previousState = itemState.get(task.id);

        return {
          id: task.id,
          type: mappedSubtasks.length ? 'group' : 'task',
          title: task.title,
          description: task.description ?? '',
          status: this.fromApiStatus(task.status),
          dueDate: task.dueDate ? this.formatDueDate(task.dueDate) : '',
          priority: this.fromApiPriority(task.priority),
          assignee: task.assignee?.fullName ?? '',
          assigneeParticipantId: task.assignee?.participantId ?? null,
          commentsCount: task.commentCount,
          selected: previousState?.selected ?? false,
          expanded: previousState?.expanded ?? true,
          subtasks: mappedSubtasks
        };
      });
  }

  private mapComment(comment: ProjectTaskCommentResponse): TodoComment {
    return {
      id: comment.id,
      author: comment.author.fullName,
      message: comment.message,
      createdAt: this.formatCommentTimestamp(comment.createdAt)
    };
  }

  private collectItemState(items: TodoItem[], state = new Map<number, { selected: boolean; expanded: boolean }>()): Map<number, { selected: boolean; expanded: boolean }> {
    for (const item of items) {
      state.set(item.id, {
        selected: !!item.selected,
        expanded: item.expanded ?? true
      });

      if (item.subtasks?.length) {
        this.collectItemState(item.subtasks, state);
      }
    }

    return state;
  }

  private getAllTasks(): TodoItem[] {
    return this.stages.flatMap((stage) => stage.tasks);
  }

  private findStageIdForTask(taskId: number): number | null {
    for (const stage of this.stages) {
      if (this.findItemById(stage.tasks, taskId)) {
        return stage.id;
      }
    }

    return null;
  }

  private filterAndSortStageTasks(tasks: TodoItem[]): TodoItem[] {
    const filteredItems = tasks
      .map((item) => this.filterItem(item))
      .filter((item): item is TodoItem => item !== null);

    const stage = this.stages.find((item) => item.tasks === tasks);
    return this.sortItems(filteredItems, stage?.sortColumn ?? 'subject', stage?.sortDirection ?? 'asc');
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

  private sortItems(items: TodoItem[], sortColumn: SortColumn, sortDirection: SortDirection): TodoItem[] {
    const directionFactor = sortDirection === 'asc' ? 1 : -1;

    return [...items]
      .map((item) => ({
        ...item,
        subtasks: item.subtasks?.length ? this.sortItems(item.subtasks, sortColumn, sortDirection) : item.subtasks
      }))
      .sort((left, right) => directionFactor * this.compareItems(left, right, sortColumn));
  }

  private compareItems(left: TodoItem, right: TodoItem, sortColumn: SortColumn): number {
    switch (sortColumn) {
      case 'subject':
        return this.compareText(left.title, right.title);
      case 'status':
        return this.compareRank(
          this.statusOptions.indexOf(left.status),
          this.statusOptions.indexOf(right.status),
          left.title,
          right.title
        );
      case 'dueDate':
        return this.compareDueDates(left.dueDate, right.dueDate, left.title, right.title);
      case 'priority':
        return this.compareRank(
          this.priorityOptions.indexOf(left.priority ?? 'Low'),
          this.priorityOptions.indexOf(right.priority ?? 'Low'),
          left.title,
          right.title
        );
      case 'assignee':
        return this.compareOptionalText(left.assignee, right.assignee, left.title, right.title);
      default:
        return 0;
    }
  }

  private compareText(left: string, right: string): number {
    return left.localeCompare(right, undefined, { sensitivity: 'base' });
  }

  private compareOptionalText(
    left: string | undefined,
    right: string | undefined,
    leftFallback: string,
    rightFallback: string
  ): number {
    const leftValue = left?.trim();
    const rightValue = right?.trim();

    if (!leftValue && !rightValue) {
      return this.compareText(leftFallback, rightFallback);
    }

    if (!leftValue) {
      return 1;
    }

    if (!rightValue) {
      return -1;
    }

    return this.compareText(leftValue, rightValue) || this.compareText(leftFallback, rightFallback);
  }

  private compareRank(leftRank: number, rightRank: number, leftFallback: string, rightFallback: string): number {
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return this.compareText(leftFallback, rightFallback);
  }

  private compareDueDates(
    leftDueDate: string | undefined,
    rightDueDate: string | undefined,
    leftFallback: string,
    rightFallback: string
  ): number {
    const leftDate = this.parseDueDate(leftDueDate);
    const rightDate = this.parseDueDate(rightDueDate);

    if (!leftDate && !rightDate) {
      return this.compareText(leftFallback, rightFallback);
    }

    if (!leftDate) {
      return 1;
    }

    if (!rightDate) {
      return -1;
    }

    const difference = leftDate.getTime() - rightDate.getTime();
    return difference || this.compareText(leftFallback, rightFallback);
  }

  private collapseTaskGroups(items: TodoItem[]): void {
    this.updateItems(items, (item) => {
      if (item.type === 'group') {
        item.expanded = false;
      }
    });
  }

  private hasActiveStageFilters(): boolean {
    return !!this.searchTerm.trim() || this.selectedStatus !== 'all';
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

  private countGroups(items: TodoItem[]): number {
    return items.reduce((count, item) => {
      const nextCount = item.type === 'group' ? 1 : 0;
      return count + nextCount + this.countGroups(item.subtasks ?? []);
    }, 0);
  }

  private collectSelectedIds(items: TodoItem[]): number[] {
    return items.flatMap((item) => [
      ...(item.selected ? [item.id] : []),
      ...(item.subtasks?.length ? this.collectSelectedIds(item.subtasks) : [])
    ]);
  }

  private startStageTitleEdit(stageId: number, title: string): void {
    this.editingStageId = stageId;
    this.editingStageValue = title;

    setTimeout(() => {
      const input = document.getElementById(`stage-title-input-${stageId}`) as HTMLInputElement | null;
      if (!input) {
        return;
      }

      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
      input.scrollLeft = input.scrollWidth;
    });
  }

  private getAssigneeMenuHeight(): number {
    const optionCount = this.projectParticipants.length + 1;
    const estimatedHeight = optionCount * 44 + 16;
    return Math.min(320, Math.max(72, estimatedHeight));
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

  private formatCommentTimestamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const maxTop = Math.max(gutter, window.innerHeight - menuHeight - gutter);
    const top = Math.min(Math.max(belowTop, gutter), maxTop);

    apply(top, left);
  }

  private fromApiStatus(status: ProjectTaskBoardStatus): TodoStatus {
    switch (status) {
      case 'TODO':
        return 'To do';
      case 'IN_PROGRESS':
        return 'In progress';
      case 'DONE':
        return 'Done';
      case 'BLOCKED':
        return 'Blocked';
      default:
        return 'To do';
    }
  }

  private toApiStatus(status: TodoStatus): ProjectTaskBoardStatus {
    switch (status) {
      case 'To do':
      case 'Idea':
      case 'In review':
        return 'TODO';
      case 'In progress':
        return 'IN_PROGRESS';
      case 'Done':
        return 'DONE';
      case 'Blocked':
        return 'BLOCKED';
      default:
        return 'TODO';
    }
  }

  private fromApiPriority(priority: ProjectTaskBoardPriority): TodoPriority {
    switch (priority) {
      case 'LOW':
        return 'Low';
      case 'MEDIUM':
        return 'Medium';
      case 'HIGH':
        return 'High';
      case 'CRITICAL':
        return 'Critical';
      default:
        return 'Medium';
    }
  }

  private toApiPriority(priority: TodoPriority): ProjectTaskBoardPriority {
    switch (priority) {
      case 'Low':
        return 'LOW';
      case 'Medium':
        return 'MEDIUM';
      case 'High':
        return 'HIGH';
      case 'Critical':
        return 'CRITICAL';
      default:
        return 'MEDIUM';
    }
  }
}
