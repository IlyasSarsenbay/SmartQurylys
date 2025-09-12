import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StageService } from '../../../core/stage.service';
import { CreateStageRequest, StageResponse, UpdateStageRequest } from '../../../core/models/stage';
import { ScheduleService } from '../../../core/schedule.service';
import { ScheduleResponse, CreateScheduleRequest } from '../../../core/models/schedule';
import { TaskService } from '../../../core/task.service';
import { TaskResponse, CreateTaskRequest, UpdateTaskRequest } from '../../../core/models/task';
import { RequirementResponse, CreateRequirementRequest } from '../../../core/models/requirement';
import { switchMap, catchError, of, finalize, tap, forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { TasksListComponent } from './tasks-list/tasks-list.component'; // Import new component

@Component({
  selector: 'app-stages-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TasksListComponent], // Add new component to imports
  templateUrl: './stages-tab.component.html',
  styleUrls: ['./stages-tab.component.css']
})
export class StagesTabComponent implements OnInit, OnChanges {
  @Input() projectId!: number;

  stages: StageResponse[] = [];
  schedule: ScheduleResponse | null = null;
  
  isLoading: boolean = true;
  isCreatingOrUpdatingStage: boolean = false;
  
  errorMessage: string | null = null;
  successMessage: string | null = null;
  
  showCreateOrEditStageForm: boolean = false;
  editingStageId: number | null = null; // ID этапа, который сейчас редактируется
  
  stageForm: FormGroup;

  // New properties for the tasks modal
  showTasksModal = false;
  currentStageForTasks: StageResponse | null = null;
  
  constructor(
    private router: Router,
    private stageService: StageService,
    private scheduleService: ScheduleService,
    private taskService: TaskService,
    private fb: FormBuilder
  ) {
    this.stageForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId) {
      this.loadScheduleAndStages(this.projectId);
    }
  }

  private setActionMessage(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.successMessage = message;
      this.errorMessage = null;
    } else {
      this.errorMessage = message;
      this.successMessage = null;
    }
    setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
    }, 5000);
  }

  loadScheduleAndStages(projectId: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.scheduleService.getSchedulesByProject(projectId).pipe(
      switchMap(schedules => {
        if (schedules && schedules.length > 0) {
          this.schedule = schedules[0];
          if (this.schedule.id) {
            return this.stageService.getStages(this.schedule.id).pipe(
              tap(stages => {
                this.stages = stages;
              }),
              switchMap(stages => {
                if (stages.length > 0) {
                  const taskLoadObservables = stages.map(stage =>
                    this.taskService.getTasksByStage(stage.id!).pipe(
                      tap(tasks => stage.tasks = tasks),
                      catchError(() => of([]))
                    )
                  );
                  return forkJoin(taskLoadObservables);
                } else {
                  return of([]);
                }
              }),
              catchError((err: HttpErrorResponse) => {
                console.error('Error loading stages:', err);
                this.errorMessage = 'Не удалось загрузить этапы. Попробуйте еще раз.';
                return of([]);
              })
            );
          } else {
            this.errorMessage = 'У расписания отсутствует ID. Невозможно загрузить этапы.';
            this.stages = [];
            return of([]);
          }
        } else {
          this.schedule = null;
          this.stages = [];
          this.errorMessage = 'Для этого проекта пока нет расписания. Нажмите "Добавить этап", чтобы создать его.';
          return of([]);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Error loading schedule:', err);
        if (err.status === 404) {
          this.errorMessage = 'Расписание для проекта не найдено. Нажмите "Добавить этап", чтобы создать расписание и первый этап.';
        } else {
          this.errorMessage = 'Не удалось загрузить расписание. Попробуйте еще раз.';
        }
        this.stages = [];
        return of([]);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe(() => {
      console.log('Stages and tasks loaded successfully.');
    });
  }

  /**
   * Открывает форму для создания нового этапа.
   */
  onCreateStage(): void {
    this.showCreateOrEditStageForm = true;
    this.editingStageId = null;
    this.stageForm.reset();
    this.successMessage = null;
    this.errorMessage = null;
  }
  
  /**
   * Открывает форму для редактирования существующего этапа.
   * @param stage Объект этапа для редактирования.
   */
  onEditStage(stage: StageResponse): void {
    if (stage.id) {
      this.editingStageId = stage.id;
      this.showCreateOrEditStageForm = true;
      this.stageForm.patchValue({
        name: stage.name,
        description: stage.description,
        startDate: stage.startDate,
        endDate: stage.endDate
      });
      this.successMessage = null;
      this.errorMessage = null;
    } else {
      this.setActionMessage('Невозможно редактировать этап без ID.', 'error');
    }
  }

  /**
   * Отправляет данные формы для создания или обновления этапа.
   */
  onSaveStage(): void {
    if (this.stageForm.invalid) {
      this.stageForm.markAllAsTouched();
      this.setActionMessage('Пожалуйста, заполните все обязательные поля.', 'error');
      return;
    }
    
    this.isCreatingOrUpdatingStage = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Если нет расписания, сначала создаем его, потом создаем этап
    if (!this.schedule) {
      if (!this.projectId) {
        this.setActionMessage('Отсутствует ID проекта. Невозможно создать расписание.', 'error');
        this.isCreatingOrUpdatingStage = false;
        return;
      }
      const scheduleName = `Расписание проекта ${this.projectId}`;
      const createScheduleRequest: CreateScheduleRequest = { name: scheduleName };
      
      this.scheduleService.createSchedule(this.projectId, createScheduleRequest).pipe(
        switchMap(newSchedule => {
          this.schedule = newSchedule;
          if (this.schedule.id) {
            return this.createStage(this.schedule.id);
          } else {
            throw new Error('Созданное расписание не вернуло ID.');
          }
        }),
        catchError(err => {
          this.setActionMessage('Ошибка при создании расписания или этапа.', 'error');
          this.isCreatingOrUpdatingStage = false;
          return of(null);
        }),
        finalize(() => this.isCreatingOrUpdatingStage = false)
      ).subscribe(result => {
        if (result) {
          this.loadScheduleAndStages(this.projectId);
          this.showCreateOrEditStageForm = false;
          this.setActionMessage('Расписание и этап успешно созданы!', 'success');
        }
      });
      
    } else if (this.schedule.id) {
      if (this.editingStageId) {
        // Логика обновления существующего этапа
        this.updateStage(this.schedule.id, this.editingStageId).pipe(
          finalize(() => this.isCreatingOrUpdatingStage = false)
        ).subscribe(result => {
          if (result) {
            this.loadScheduleAndStages(this.projectId);
            this.showCreateOrEditStageForm = false;
            this.setActionMessage('Этап успешно обновлен!', 'success');
          }
        });
      } else {
        // Логика создания нового этапа в существующем расписании
        this.createStage(this.schedule.id).pipe(
          finalize(() => this.isCreatingOrUpdatingStage = false)
        ).subscribe(result => {
          if (result) {
            this.loadScheduleAndStages(this.projectId);
            this.showCreateOrEditStageForm = false;
            this.setActionMessage('Этап успешно создан!', 'success');
          }
        });
      }
    } else {
      this.setActionMessage('Расписание не имеет ID. Невозможно создать/обновить этап.', 'error');
      this.isCreatingOrUpdatingStage = false;
    }
  }

  private createStage(scheduleId: number) {
    const formValue = this.stageForm.value;
    const createStageRequest: CreateStageRequest = {
      name: formValue.name,
      description: formValue.description,
      startDate: formValue.startDate,
      endDate: formValue.endDate
    };
    return this.stageService.createStage(scheduleId, createStageRequest).pipe(
      catchError(err => {
        console.error('Error creating stage:', err);
        this.setActionMessage('Ошибка при создании этапа.', 'error');
        return of(null);
      })
    );
  }

  private updateStage(scheduleId: number, stageId: number) {
    const formValue = this.stageForm.value;
    const updateStageRequest: UpdateStageRequest = {
      name: formValue.name,
      description: formValue.description,
      startDate: formValue.startDate,
      endDate: formValue.endDate
    };
    return this.stageService.updateStage(scheduleId, stageId, updateStageRequest).pipe(
      catchError(err => {
        console.error('Error updating stage:', err);
        this.setActionMessage('Ошибка при обновлении этапа.', 'error');
        return of(null);
      })
    );
  }

  onCancelForm(): void {
    this.showCreateOrEditStageForm = false;
    this.stageForm.reset();
    this.editingStageId = null;
    this.successMessage = null;
    this.errorMessage = null;
  }
  
  openTasksModal(stage: StageResponse): void {
    if (stage) {
      this.currentStageForTasks = stage;
      this.showTasksModal = true;
    } else {
      this.setActionMessage('Не удалось открыть задачи. У этапа отсутствует ID.', 'error');
    }
  }
  
  closeTasksModal(): void {
    this.showTasksModal = false;
    this.currentStageForTasks = null;
    this.loadScheduleAndStages(this.projectId); // Reload stages to refresh task counts
  }

  /**
   * Deletes a stage from the schedule.
   * Удаляет этап из расписания.
   * @param stageId The ID of the stage to delete.
   */
  deleteStage(stageId: number): void {
    if (!this.schedule || !this.schedule.id) {
      this.setActionMessage('Отсутствует ID расписания. Невозможно удалить этап.', 'error');
      return;
    }

    // В реальном приложении здесь нужно показать модальное окно подтверждения, а не alert.
    if (confirm('Вы уверены, что хотите удалить этот этап?')) {
      this.stageService.deleteStage(this.schedule.id, stageId).pipe(
        tap(() => {
          this.setActionMessage('Этап успешно удален.', 'success');
          // Обновляем список этапов, чтобы отразить изменения
          this.loadScheduleAndStages(this.projectId);
        }),
        catchError(err => {
          this.setActionMessage('Ошибка при удалении этапа.', 'error');
          return of(null);
        })
      ).subscribe();
    }
  }
}


