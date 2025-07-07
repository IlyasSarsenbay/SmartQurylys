
import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ScheduleResponse, CreateScheduleRequest } from '../../../core/models/schedule';
import { StageResponse, CreateStageRequest } from '../../../core/models/stage';
import { TaskResponse, CreateTaskRequest } from '../../../core/models/task';
import { StageStatus } from '../../../core/enums/stage-status.enum';
import { ScheduleService } from '../../../core/schedule.service';
import { StageService } from '../../../core/stage.service';
import { TaskService } from '../../../core/task.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, finalize, tap, switchMap } from 'rxjs/operators';
import { throwError, of, forkJoin, Observable } from 'rxjs';


@Component({
  selector: 'app-gpr-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './gpr-tab.component.html',
  styleUrls: ['./gpr-tab.component.css']
})
export class GprTabComponent implements OnInit, OnChanges {
  @Input() projectId!: number;

  schedule: ScheduleResponse | null = null;
  loading = true;
  error: string | null = null;

  initialGprName: string = '';

  showAddStageModal = false;
  addStageForm: FormGroup;

  showAddTaskModal = false;
  addTaskForm: FormGroup;
  currentStageIdForTask: number | null = null;

  StageStatus = StageStatus;

  constructor(
    private scheduleService: ScheduleService,
    private stageService: StageService,
    private taskService: TaskService,
    private fb: FormBuilder
  ) {
    this.addStageForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: [''],
      endDate: [''],
      contractors: [''],
      resources: [''],
      status: [StageStatus.WAITING, Validators.required]
    });

    this.addTaskForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: [''],
      endDate: [''],
      responsiblePersonId: [null],
      info: [''],
      isPriority: [false],
      executionRequested: [false],
      executed: [false],
      dependsOnTaskIds: [[]]
    });
  }

  ngOnInit(): void {
    console.log('GprTabComponent ngOnInit. Initial Project ID:', this.projectId);
    if (this.projectId) {
      this.loadSchedule();
    } else {
      this.loading = false;
      this.error = 'Project ID is not provided to GPR tab yet. Waiting for input.';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId']) {
      const currentProjectId = changes['projectId'].currentValue;
      const previousProjectId = changes['projectId'].previousValue;

      console.log('GprTabComponent ngOnChanges. Project ID changed from', previousProjectId, 'to', currentProjectId);

      if (currentProjectId && currentProjectId !== previousProjectId) {
        this.loadSchedule();
      } else if (!currentProjectId) {
        this.loading = false;
        this.error = 'Project ID is not provided to GPR tab.';
      }
    }
  }

  loadSchedule(): void {
    if (!this.projectId) {
      console.warn('[loadSchedule] called without projectId. Aborting.');
      this.error = 'Project ID is missing. Cannot load GPR schedule.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;
    console.log(`[loadSchedule] Attempting to load schedule for project ID: ${this.projectId}`);

    this.scheduleService.getSchedulesByProject(this.projectId).pipe(
      switchMap(schedules => {
        console.log('[loadSchedule] Schedules received:', schedules);
        if (schedules && schedules.length > 0) {
          this.schedule = schedules[0];
          console.log('[loadSchedule] Active schedule set:', this.schedule);

          return this.stageService.getStages(this.schedule.id!).pipe(
            switchMap(stages => {
              this.schedule!.stages = stages; 
              console.log('[loadSchedule] Stages loaded:', stages);

              if (stages.length > 0) {
                const taskLoadObservables: Observable<any>[] = stages.map(stage => {
                  stage.expanded = false; 
                  if (stage.id) {
                    return this.taskService.getTasksByStage(stage.id).pipe(
                      catchError((err: HttpErrorResponse) => {
                        console.error(`[loadSchedule] Error loading tasks for stage ${stage.id}:`, err);
                        return of([]); 
                      }),
                      tap(tasks => {
                        stage.tasks = tasks; 
                        console.log(`[loadSchedule] Tasks loaded for stage ${stage.id}:`, tasks);
                      })
                    );
                  }
                  return of([]); 
                });
                return forkJoin(taskLoadObservables); 
              } else {
                console.log('[loadSchedule] No stages found, skipping task loading.');
                return of([]); 
              }
            })
          );
        } else {
          this.schedule = null;
          console.log('[loadSchedule] No schedule found for this project. Displaying creation option.');
          return of([]); 
        }
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('[loadSchedule] Error in main pipeline:', err);
        let isGprNotFound = false;

        if (err.error && typeof err.error === 'object' && err.error.error === 'ГПР не найден') {
          isGprNotFound = true;
        } else if (Array.isArray(err.error) && err.error.length > 0 && typeof err.error[0] === 'string') {
          try {
            const errorObj = JSON.parse(err.error[0]);
            if (errorObj.error === 'ГПР не найден') {
              isGprNotFound = true;
            }
          } catch (parseError) {
            console.error('[loadSchedule] Failed to parse error response as JSON:', parseError);
          }
        }

        if (err.status === 404 || isGprNotFound || (err.status === 200 && (err.error === null || (Array.isArray(err.error) && err.error.length === 0)))) {
          console.log('[loadSchedule] Interpreting error as "no schedule exists".');
          this.schedule = null;
          this.error = null;
          return of([]); 
        } else {
          this.error = `Не удалось загрузить ГПР. (${this.extractErrorMessage(err)})`;
          return throwError(() => err); 
        }
      }),
      finalize(() => {
        this.loading = false; 
        console.log('[loadSchedule] Finalize block: Loading set to false.');
      })
    ).subscribe({
      next: () => {
        console.log('[loadSchedule] All data (schedule, stages, tasks) successfully processed.');
      },
      error: (err) => {
        console.log('[loadSchedule] Subscription error handler triggered (error already handled in catchError).');
      }
    });
  }

  // --- Методы для этапов (Stages) ---
  openAddStageModal(): void {
    this.addStageForm.reset({ status: StageStatus.WAITING });
    this.showAddStageModal = true;
  }

  closeAddStageModal(): void {
    this.showAddStageModal = false;
    this.addStageForm.reset();
  }

  addStage(): void {
    if (this.addStageForm.invalid) {
      this.addStageForm.markAllAsTouched();
      console.warn('[addStage] Add Stage Form is invalid. Not submitting.');
      return;
    }
    if (!this.schedule || !this.schedule.id) {
      alert('Ошибка: Расписание ГПР не найдено или не имеет ID. Пожалуйста, сначала создайте расписание.');
      console.error('[addStage] Schedule or Schedule ID is missing. Cannot add stage.');
      return;
    }

    const request: CreateStageRequest = this.addStageForm.value;
    console.log(`[addStage] Attempting to create stage for schedule ID ${this.schedule.id} with request:`, JSON.stringify(request, null, 2));

    this.stageService.createStage(this.schedule.id, request).pipe(
      tap(response => {
        console.log('[addStage] Stage creation successful. Response:', response);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('[addStage] Error creating stage:', err);
        this.error = `Не удалось создать этап. (${this.extractErrorMessage(err)})`;
        alert(`Не удалось создать этап: ${this.extractErrorMessage(err)}`);
        return throwError(() => err);
      })
    ).subscribe({
      next: (stage) => {
        console.log('[addStage] Stage created on backend. Reloading schedule...');
        this.closeAddStageModal();
        this.loadSchedule(); 
        console.log('[addStage] loadSchedule() called after successful stage creation.');
      },
      error: (err) => {
        console.log('[addStage] Stage creation subscription error handler triggered (already handled in catchError).');
      }
    });
  }

  // --- Методы для задач (Tasks) ---
  openAddTaskModal(stageId: number): void {
    this.currentStageIdForTask = stageId;
    this.addTaskForm.reset({ isPriority: false, executionRequested: false, executed: false, dependsOnTaskIds: [] });
    this.showAddTaskModal = true;
  }

  closeAddTaskModal(): void {
    this.showAddTaskModal = false;
    this.addTaskForm.reset();
    this.currentStageIdForTask = null;
  }

  addTask(): void {
    if (this.addTaskForm.invalid) {
      this.addTaskForm.markAllAsTouched();
      console.warn('[addTask] Add Task Form is invalid. Not submitting.');
      return;
    }
    if (this.currentStageIdForTask === null) {
      alert('Не удалось определить этап для задачи.');
      console.error('[addTask] Current Stage ID for task is null. Cannot add task.');
      return;
    }

    const request: CreateTaskRequest = this.addTaskForm.value;
    console.log(`[addTask] Attempting to create task for stage ID ${this.currentStageIdForTask} with request:`, JSON.stringify(request, null, 2));

    this.taskService.createTask(this.currentStageIdForTask, request).pipe(
      tap(response => {
        console.log('[addTask] Task creation successful. Response:', response);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('[addTask] Error creating task:', err);
        this.error = `Не удалось создать задачу. (${this.extractErrorMessage(err)})`;
        alert(`Не удалось создать задачу: ${this.extractErrorMessage(err)}`);
        return throwError(() => err);
      })
    ).subscribe({
      next: (task) => {
        console.log('[addTask] Task created on backend. Reloading schedule...');
        this.closeAddTaskModal();
        this.loadSchedule(); 
        console.log('[addTask] loadSchedule() called after successful task creation.');
      },
      error: (err) => {
        console.log('[addTask] Task creation subscription error handler triggered (already handled in catchError).');
      }
    });
  }

  toggleStageExpansion(stage: StageResponse): void {
    stage.expanded = !stage.expanded;
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    if (err.error instanceof ProgressEvent) {
      return 'Ошибка сети: проверьте подключение.';
    } else if (err.error && typeof err.error === 'object' && err.error.message) {
      return err.error.message;
    } else if (err.error && typeof err.error === 'object' && err.error.error) {
      return err.error.error;
    } else if (typeof err.error === 'string') {
      return err.error;
    }
    return 'Неизвестная ошибка.';
  }

  importExcel(): void {
    alert('Функция импорта таблицы Excel будет реализована.');
  }

  linkWorks(): void {
    alert('Функция связывания работ будет реализована.');
  }

  togglePriorityMarking(): void {
    alert('Функция "Отметить как приоритет" будет реализована для выбора задачи.');
  }

  markAsPriority(task: TaskResponse): void {
    const stageId = this.schedule?.stages.find(s => s.tasks.some(t => t.id === task.id))?.id;
    if (!stageId) {
      console.error('Could not find parent stage for task:', task);
      alert('Ошибка: Не удалось определить этап для задачи.');
      return;
    }

    this.taskService.markAsPriority(stageId, task.id).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('Error marking task as priority:', err);
        alert(`Не удалось изменить приоритет задачи. (${this.extractErrorMessage(err)})`);
        return throwError(() => err);
      })
    ).subscribe({
      next: () => {
        task.isPriority = !task.isPriority;
        alert(`Приоритет задачи "${task.name}" изменен.`);
      }
    });
  }

  createInitialSchedule(): void {
    if (!this.projectId) {
      this.error = 'Project ID is missing to create a schedule.';
      return;
    }
    if (!this.initialGprName.trim()) {
      alert('Пожалуйста, введите название для нового расписания ГПР.');
      return;
    }
    const request: CreateScheduleRequest = { name: this.initialGprName.trim() };
    console.log(`[createInitialSchedule] Attempting to create initial schedule for project ID: ${this.projectId} with request:`, JSON.stringify(request, null, 2));
    this.scheduleService.createSchedule(this.projectId, request).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('[createInitialSchedule] Error creating initial schedule:', err);
        this.error = `Не удалось создать расписание ГПР. (${this.extractErrorMessage(err)})`;
        alert(`Не удалось создать расписание ГПР: ${this.extractErrorMessage(err)}`);
        return throwError(() => err);
      })
    ).subscribe({
      next: (newSchedule) => {
        console.log('[createInitialSchedule] Initial schedule successfully created:', newSchedule);
        this.schedule = newSchedule;
        if (!this.schedule.stages) {
          this.schedule.stages = [];
        }
        alert('Основное расписание ГПР успешно создано!');
        this.initialGprName = '';
        this.loadSchedule(); 
        console.log('[createInitialSchedule] loadSchedule() called after successful schedule creation.');
      },
      error: (err) => {
        console.log('[createInitialSchedule] Initial schedule creation subscription error handler triggered (already handled in catchError).');
      }
    });
  }
}
