// import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
// import { ScheduleResponse, CreateScheduleRequest, UpdateScheduleRequest } from '../../../core/models/schedule';
// import { StageResponse, CreateStageRequest, UpdateStageRequest } from '../../../core/models/stage';
// import { TaskResponse, CreateTaskRequest, UpdateTaskRequest } from '../../../core/models/task';
// import { StageStatus } from '../../../core/enums/stage-status.enum';
// import { ScheduleService } from '../../../core/schedule.service';
// import { StageService } from '../../../core/stage.service';
// import { TaskService } from '../../../core/task.service';
// import { HttpErrorResponse } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
// import { catchError, finalize, tap, switchMap } from 'rxjs/operators';
// import { throwError, of, forkJoin, Observable } from 'rxjs';
// import { ParticipantResponse } from '../../../core/models/participant'; // Используем ParticipantResponse
// import { ParticipantService } from '../../../core/participant.service'; // Используем ParticipantService


// @Component({
//   selector: 'app-gpr-tab',
//   standalone: true,
//   imports: [CommonModule, FormsModule, ReactiveFormsModule],
//   templateUrl: './gpr-tab.component.html',
//   styleUrls: ['./gpr-tab.component.css']
// })
// export class GprTabComponent implements OnInit, OnChanges {
//   @Input() projectId!: number;

//   schedule: ScheduleResponse | null = null;
//   loading = true;
//   error: string | null = null; // Для общих ошибок загрузки/операций
//   successMessage: string | null = null; // Для сообщений об успешных операциях
//   actionError: string | null = null; // Для ошибок конкретных действий (CRUD)

//   initialGprName: string = '';
//   isEditingGprName: boolean = false;

//   showAddStageModal = false;
//   addStageForm: FormGroup;

//   showEditStageModal = false;
//   editStageForm: FormGroup;
//   currentStageToEdit: StageResponse | null = null;

//   showAddTaskModal = false;
//   addTaskForm: FormGroup;
//   currentStageIdForTask: number | null = null;

//   showEditTaskModal = false;
//   editTaskForm: FormGroup;
//   currentTaskToEdit: TaskResponse | null = null;
//   currentTaskParentStageId: number | null = null;

//   showConfirmModal: boolean = false;
//   confirmModalMessage: string = '';
//   confirmAction: (() => void) | null = null;

  
//   showLinkTasksModal: boolean = false;
//   linkTasksForm: FormGroup;
//   allTasks: TaskResponse[] = []; // Список всех задач для выбора
//   selectedTaskToLink: TaskResponse | null = null; // Задача, для которой устанавливаем зависимости
//   linkTaskError: string | null = null;
//   linkTaskSuccess: string | null = null;
  
//   // Добавлено для импорта Excel
//   @ViewChild('fileInput') fileInput!: ElementRef;
  
//   // Добавлено для выбора ответственных - теперь это участники
//   allParticipants: ParticipantResponse[] = [];


//   StageStatus = StageStatus;

//   get stageStatusValues(): string[] {
//     return Object.values(StageStatus);
//   }

//   constructor(
//     private scheduleService: ScheduleService,
//     private stageService: StageService,
//     private taskService: TaskService,
//     private participantService: ParticipantService, // Используем ParticipantService
//     private fb: FormBuilder
//   ) {
//     this.addStageForm = this.fb.group({
//       name: ['', Validators.required],
//       description: [''],
//       startDate: [''],
//       endDate: [''],
//       contractors: [''],
//       resources: [''],
//       status: [StageStatus.WAITING, Validators.required]
//     });

//     this.editStageForm = this.fb.group({
//       name: ['', Validators.required],
//       description: [''],
//       startDate: [''],
//       endDate: [''],
//       contractors: [''],
//       resources: [''],
//       status: ['', Validators.required]
//     });

//     this.addTaskForm = this.fb.group({
//       name: ['', Validators.required],
//       description: [''],
//       startDate: [''],
//       endDate: [''],
//       responsiblePersonId: [null], // Теперь это просто ID
//       info: [''],
//       isPriority: [false],
//       executionRequested: [false],
//       executed: [false],
//       dependsOnTaskIds: [[]]
//     });

//     this.editTaskForm = this.fb.group({
//       name: ['', Validators.required],
//       description: [''],
//       startDate: [''],
//       endDate: [''],
//       responsiblePersonId: [null], // Теперь это просто ID
//       info: [''],
//       isPriority: [false],
//       executionRequested: [false],
//       executed: [false],
//       dependsOnTaskIds: [[]]
//     });

//     // Инициализация формы для связывания задач
//     this.linkTasksForm = this.fb.group({
//       taskId: [null, Validators.required], // ID задачи, для которой настраиваются зависимости
//       selectedDependencies: this.fb.array([]) // FormArray для выбранных зависимостей
//     });
//   }

//   ngOnInit(): void {
//     console.log('GprTabComponent ngOnInit. Initial Project ID:', this.projectId);
//     if (this.projectId) {
//       this.loadSchedule();
//       this.loadParticipants(); // Загружаем список участников при инициализации
//     } else {
//       this.loading = false;
//       this.error = 'Project ID is not provided to GPR tab yet. Waiting for input.';
//     }
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['projectId']) {
//       const currentProjectId = changes['projectId'].currentValue;
//       const previousProjectId = changes['projectId'].previousValue;

//       console.log('GprTabComponent ngOnChanges. Project ID changed from', previousProjectId, 'to', currentProjectId);

//       if (currentProjectId && currentProjectId !== previousProjectId) {
//         this.loadSchedule();
//         this.loadParticipants(); // Перезагружаем участников при смене проекта
//       } else if (!currentProjectId) {
//         this.loading = false;
//         this.error = 'Project ID is not provided to GPR tab.';
//       }
//     }
//   }

//   // --- Методы для сообщений ---
//   setSuccessMessage(message: string): void {
//     this.successMessage = message;
//     this.actionError = null; // Очищаем ошибку при успехе
//     setTimeout(() => this.successMessage = null, 5000); // Сообщение исчезнет через 5 секунд
//   }

//   setActionError(message: string): void {
//     this.actionError = message;
//     this.successMessage = null; // Очищаем успех при ошибке
//     setTimeout(() => this.actionError = null, 7000); // Сообщение исчезнет через 7 секунд
//   }

//   clearMessages(): void {
//     this.successMessage = null;
//     this.actionError = null;
//     this.error = null;
//     this.linkTaskError = null; // Очищаем сообщения модального окна связей
//     this.linkTaskSuccess = null;
//   }

//   // --- Загрузка участников ---
//   loadParticipants(): void {
//     if (!this.projectId) {
//       console.warn('Cannot load participants: Project ID is null.');
//       return;
//     }
//     this.participantService.getParticipantsByProject(this.projectId).pipe(
//       catchError((err: HttpErrorResponse) => {
//         console.error('Error loading participants:', err);
//         // Не устанавливаем error, так как это не критическая ошибка для отображения ГПР
//         return of([]);
//       })
//     ).subscribe(participants => {
//       this.allParticipants = participants;
//       console.log('Loaded participants:', this.allParticipants);
//     });
//   }

//   // --- Основная загрузка расписания ---
//   loadSchedule(): void {
//     this.clearMessages(); // Очищаем сообщения при новой загрузке

//     if (!this.projectId) {
//       console.warn('[loadSchedule] called without projectId. Aborting.');
//       this.error = 'Project ID is missing. Cannot load GPR schedule.';
//       this.loading = false;
//       return;
//     }

//     this.loading = true;
//     this.error = null;
//     console.log(`[loadSchedule] Attempting to load schedule for project ID: ${this.projectId}`);

//     this.scheduleService.getSchedulesByProject(this.projectId).pipe(
//       switchMap(schedules => {
//         console.log('[loadSchedule] Schedules received:', schedules);
//         if (schedules && schedules.length > 0) {
//           this.schedule = schedules[0];
//           this.initialGprName = this.schedule.name;
//           console.log('[loadSchedule] Active schedule set:', this.schedule);

//           return this.stageService.getStages(this.schedule.id!).pipe(
//             switchMap(stages => {
//               this.schedule!.stages = stages;
//               console.log('[loadSchedule] Stages loaded:', stages);

//               if (stages.length > 0) {
//                 const taskLoadObservables: Observable<any>[] = stages.map(stage => {
//                   stage.expanded = false;
//                   if (stage.id) {
//                     return this.taskService.getTasksByStage(stage.id).pipe(
//                       catchError((err: HttpErrorResponse) => {
//                         console.error(`[loadSchedule] Error loading tasks for stage ${stage.id}:`, err);
//                         return of([]);
//                       }),
//                       tap(tasks => {
//                         // Здесь мы преобразуем `responsiblePerson` (объект) в `responsiblePersonId` (число)
//                         // и `dependsOn` (массив объектов) в `dependsOnTaskIds` (массив чисел) для форм
//                         stage.tasks = tasks.map(task => ({
//                             ...task,
//                             responsiblePersonId: task.responsiblePerson?.id || null, // Извлекаем ID из объекта
//                             dependsOnTaskIds: task.dependsOn?.map(dep => dep.id) || [] // Извлекаем ID из массива объектов
//                         }));
//                         console.log(`[loadSchedule] Tasks loaded for stage ${stage.id}:`, tasks);
//                       })
//                     );
//                   }
//                   return of([]);
//                 });
//                 return forkJoin(taskLoadObservables).pipe(
//                   tap(() => {
//                     this.updateAllTasksList(); // Обновляем список всех задач после загрузки
//                   })
//                 );
//               } else {
//                 console.log('[loadSchedule] No stages found, skipping task loading.');
//                 this.updateAllTasksList(); // Обновляем список даже если нет задач
//                 return of([]);
//               }
//             })
//           );
//         } else {
//           this.schedule = null;
//           this.initialGprName = '';
//           this.allTasks = []; // Очищаем список задач, если нет расписания
//           console.log('[loadSchedule] No schedule found for this project. Displaying creation option.');
//           return of([]);
//         }
//       }),
//       catchError((err: HttpErrorResponse) => {
//         console.error('[loadSchedule] Error in main pipeline:', err);
//         let isGprNotFound = false;

//         if (err.error && typeof err.error === 'object' && err.error.error === 'ГПР не найден') {
//           isGprNotFound = true;
//         } else if (Array.isArray(err.error) && err.error.length > 0 && typeof err.error[0] === 'string') {
//           try {
//             const errorObj = JSON.parse(err.error[0]);
//             if (errorObj.error === 'ГПР не найден') {
//               isGprNotFound = true;
//             }
//           } catch (parseError) {
//             console.error('[loadSchedule] Failed to parse error response as JSON:', parseError);
//           }
//         }

//         if (err.status === 404 || isGprNotFound || (err.status === 200 && (err.error === null || (Array.isArray(err.error) && err.error.length === 0)))) {
//           console.log('[loadSchedule] Interpreting error as "no schedule exists".');
//           this.schedule = null;
//           this.error = null;
//           this.allTasks = [];
//           return of([]);
//         } else {
//           this.error = `Не удалось загрузить ГПР. (${this.extractErrorMessage(err)})`;
//           return throwError(() => err);
//         }
//       }),
//       finalize(() => {
//         this.loading = false;
//         console.log('[loadSchedule] Finalize block: Loading set to false.');
//       })
//     ).subscribe({
//       next: () => {
//         console.log('[loadSchedule] All data (schedule, stages, tasks) successfully processed.');
//       },
//       error: (err) => {
//         console.log('[loadSchedule] Subscription error handler triggered (already handled in catchError).');
//       }
//     });
//   }

//   // Метод для обновления списка всех задач
//   updateAllTasksList(): void {
//     this.allTasks = [];
//     if (this.schedule && this.schedule.stages) {
//       this.schedule.stages.forEach(stage => {
//         if (stage.tasks) {
//           // Важно: здесь мы добавляем задачи как они есть, с responsiblePersonId и dependsOnTaskIds
//           this.allTasks.push(...stage.tasks);
//         }
//       });
//     }
//   }

//   // --- Методы для расписания (Schedule) ---
//   toggleEditGprName(): void {
//     this.isEditingGprName = !this.isEditingGprName;
//     if (!this.isEditingGprName && this.schedule) {
//       this.initialGprName = this.schedule.name;
//     }
//   }

//   saveGprName(): void {
//     this.clearMessages();
//     if (!this.schedule || !this.schedule.id || !this.projectId) {
//       this.setActionError('Ошибка: Расписание ГПР или ID проекта не найдены.');
//       return;
//     }
//     if (!this.initialGprName.trim()) {
//       this.setActionError('Название ГПР не может быть пустым.');
//       return;
//     }

//     const request: UpdateScheduleRequest = { name: this.initialGprName.trim() };
//     this.scheduleService.updateSchedule(this.projectId, request).pipe(
//       catchError((err: HttpErrorResponse) => {
//         console.error('Error updating GPR name:', err);
//         this.setActionError(`Не удалось обновить название ГПР: ${this.extractErrorMessage(err)}`);
//         return throwError(() => err);
//       })
//     ).subscribe({
//       next: (updatedSchedule) => {
//         this.schedule!.name = updatedSchedule.name;
//         this.isEditingGprName = false;
//         this.setSuccessMessage('Название ГПР успешно обновлено!');
//       }
//     });
//   }

//   createInitialSchedule(): void {
//     this.clearMessages();
//     if (!this.projectId) {
//       this.setActionError('Project ID is missing to create a schedule.');
//       return;
//     }
//     if (!this.initialGprName.trim()) {
//       this.setActionError('Пожалуйста, введите название для нового расписания ГПР.');
//       return;
//     }
//     const request: CreateScheduleRequest = { name: this.initialGprName.trim() };
//     console.log(`[createInitialSchedule] Attempting to create initial schedule for project ID: ${this.projectId} with request:`, JSON.stringify(request, null, 2));
//     this.scheduleService.createSchedule(this.projectId, request).pipe(
//       catchError((err: HttpErrorResponse) => {
//         console.error('[createInitialSchedule] Error creating initial schedule:', err);
//         this.setActionError(`Не удалось создать расписание ГПР: ${this.extractErrorMessage(err)}`);
//         return throwError(() => err);
//       })
//     ).subscribe({
//       next: (newSchedule) => {
//         console.log('[createInitialSchedule] Initial schedule successfully created:', newSchedule);
//         this.schedule = newSchedule;
//         if (!this.schedule.stages) {
//           this.schedule.stages = [];
//         }
//         this.setSuccessMessage('Основное расписание ГПР успешно создано!');
//         this.initialGprName = newSchedule.name;
//         this.loadSchedule(); // Перезагружаем, чтобы получить все детали (стадии, задачи)
//       },
//       error: (err) => {
//         console.log('[createInitialSchedule] Initial schedule creation subscription error handler triggered (already handled in catchError).');
//       }
//     });
//   }

//   // --- Методы для этапов (Stages) ---
//   openAddStageModal(): void {
//     this.addStageForm.reset({ status: StageStatus.WAITING });
//     this.showAddStageModal = true;
//     this.clearMessages();
//   }

//   closeAddStageModal(): void {
//     this.showAddStageModal = false;
//     this.addStageForm.reset();
//     this.clearMessages();
//   }

//   addStage(): void {
//     this.clearMessages();
//     if (this.addStageForm.invalid) {
//       this.addStageForm.markAllAsTouched();
//       console.warn('[addStage] Add Stage Form is invalid. Not submitting.');
//       this.setActionError('Пожалуйста, заполните все обязательные поля этапа.');
//       return;
//     }
//     if (!this.schedule || !this.schedule.id) {
//       this.setActionError('Ошибка: Расписание ГПР не найдено или не имеет ID. Пожалуйста, сначала создайте расписание.');
//       console.error('[addStage] Schedule or Schedule ID is missing. Cannot add stage.');
//       return;
//     }

//     const request: CreateStageRequest = this.addStageForm.value;
//     console.log(`[addStage] Attempting to create stage for schedule ID ${this.schedule.id} with request:`, JSON.stringify(request, null, 2));

//     this.stageService.createStage(this.schedule.id, request).pipe(
//       tap(response => {
//         console.log('[addStage] Stage creation successful. Response:', response);
//       }),
//       catchError((err: HttpErrorResponse) => {
//         console.error('[addStage] Error creating stage:', err);
//         this.setActionError(`Не удалось создать этап: ${this.extractErrorMessage(err)}`);
//         return throwError(() => err);
//       })
//     ).subscribe({
//       next: (stage) => {
//         console.log('[addStage] Stage created on backend. Reloading schedule...');
//         this.closeAddStageModal();
//         this.loadSchedule();
//         this.setSuccessMessage('Этап успешно создан!');
//         console.log('[addStage] loadSchedule() called after successful stage creation.');
//       },
//       error: (err) => {
//         console.log('[addStage] Stage creation subscription error handler triggered (already handled in catchError).');
//       }
//     });
//   }

//   openEditStageModal(stage: StageResponse): void {
//     this.currentStageToEdit = { ...stage };
//     this.editStageForm.patchValue({
//       name: stage.name,
//       description: stage.description,
//       startDate: stage.startDate,
//       endDate: stage.endDate,
//       contractors: stage.contractors,
//       resources: stage.resources,
//       status: stage.status
//     });
//     this.showEditStageModal = true;
//     this.clearMessages();
//   }

//   closeEditStageModal(): void {
//     this.showEditStageModal = false;
//     this.currentStageToEdit = null;
//     this.editStageForm.reset();
//     this.clearMessages();
//   }

//   saveStageChanges(): void {
//     this.clearMessages();
//     if (this.editStageForm.invalid) {
//       this.editStageForm.markAllAsTouched();
//       console.warn('[saveStageChanges] Edit Stage Form is invalid. Not submitting.');
//       this.setActionError('Пожалуйста, заполните все обязательные поля этапа.');
//       return;
//     }
//     if (!this.currentStageToEdit || !this.currentStageToEdit.id || !this.schedule || !this.schedule.id) {
//       this.setActionError('Ошибка: Этап или расписание для редактирования не найдены.');
//       console.error('[saveStageChanges] Current Stage to Edit, its ID, or Schedule ID is missing. Cannot save changes.');
//       return;
//     }

//     const request: UpdateStageRequest = this.editStageForm.value;
//     console.log(`[saveStageChanges] Attempting to update stage ${this.currentStageToEdit.id} for schedule ${this.schedule.id} with request:`, JSON.stringify(request, null, 2));

//     this.stageService.updateStage(this.schedule.id, this.currentStageToEdit.id, request).pipe(
//       catchError((err: HttpErrorResponse) => {
//         console.error('[saveStageChanges] Error updating stage:', err);
//         this.setActionError(`Не удалось обновить этап: ${this.extractErrorMessage(err)}`);
//         return throwError(() => err);
//       })
//     ).subscribe({
//       next: (updatedStage) => {
//         console.log('[saveStageChanges] Stage updated on backend. Reloading schedule...');
//         this.closeEditStageModal();
//         this.loadSchedule();
//         this.setSuccessMessage('Этап успешно обновлен!');
//       },
//       error: (err) => {
//         console.log('[saveStageChanges] Stage update subscription error handler triggered (already handled in catchError).');
//       }
//     });
//   }

//   confirmDeleteStage(stageId: number): void {
//     this.clearMessages();
//     this.confirmModalMessage = 'Вы уверены, что хотите удалить этот этап и все его задачи? Это действие нельзя отменить.';
//     this.confirmAction = () => this.deleteStage(stageId);
//     this.showConfirmModal = true;
//   }

//   deleteStage(stageId: number): void {
//     this.closeConfirmModal();
//     this.clearMessages();

//     if (!this.schedule || !this.schedule.id) {
//       this.setActionError('Ошибка: Расписание ГПР не найдено. Невозможно удалить этап.');
//       console.error('[deleteStage] Schedule ID is missing. Cannot delete stage.');
//       return;
//     }

//     this.stageService.deleteStage(this.schedule.id, stageId).pipe(
//       catchError((err: HttpErrorResponse) => {
//         console.error('[deleteStage] Error deleting stage:', err);
//         this.setActionError(`Не удалось удалить этап: ${this.extractErrorMessage(err)}`);
//         return throwError(() => err);
//       })
//     ).subscribe({
//       next: () => {
//         console.log('[deleteStage] Stage deleted on backend. Reloading schedule...');
//         this.loadSchedule();
//         this.setSuccessMessage('Этап успешно удален!');
//       },
//       error: (err) => {
//         console.log('[deleteStage] Stage deletion subscription error handler triggered (already handled in catchError).');
//       }
//     });
//   }


//   openAddTaskModal(stageId: number): void {
//     this.currentStageIdForTask = stageId;
//     this.addTaskForm.reset({ isPriority: false, executionRequested: false, executed: false, dependsOnTaskIds: [] });
//     this.showAddTaskModal = true;
//     this.clearMessages();
//   }

//   closeAddTaskModal(): void {
//     this.showAddTaskModal = false;
//     this.addTaskForm.reset();
//     this.currentStageIdForTask = null;
//     this.clearMessages();
//   }

//   addTask(): void {
//     this.clearMessages();
//     if (this.addTaskForm.invalid) {
//       this.addTaskForm.markAllAsTouched();
//       console.warn('[addTask] Add Task Form is invalid. Not submitting.');
//       this.setActionError('Пожалуйста, заполните все обязательные поля задачи.');
//       return;
//     }
//     if (this.currentStageIdForTask === null) {
//       this.setActionError('Не удалось определить этап для задачи.');
//       console.error('[addTask] Current Stage ID for task is null. Cannot add task.');
//       return;
//     }

//     const request: CreateTaskRequest = this.addTaskForm.value;
//     console.log(`[addTask] Attempting to create task for stage ID ${this.currentStageIdForTask} with request:`, JSON.stringify(request, null, 2));

//     this.taskService.createTask(this.currentStageIdForTask, request).pipe(
//       tap(response => {
//         console.log('[addTask] Task creation successful. Response:', response);
//       }),
//       catchError((err: HttpErrorResponse) => {
//         console.error('[addTask] Error creating task:', err);
//         this.setActionError(`Не удалось создать задачу: ${this.extractErrorMessage(err)}`);
//         return throwError(() => err);
//       })
//     ).subscribe({
//       next: (task) => {
//         console.log('[addTask] Task created on backend. Reloading schedule...');
//         this.closeAddTaskModal();
//         this.loadSchedule();
//         this.setSuccessMessage('Задача успешно создана!');
//       },
//       error: (err) => {
//         console.log('[addTask] Task creation subscription error handler triggered (already handled in catchError).');
//       }
//     });
//   }

//   openEditTaskModal(task: TaskResponse, parentStageId: number): void {
//     this.currentTaskToEdit = { ...task };
//     this.currentTaskParentStageId = parentStageId;
//     this.editTaskForm.patchValue({
//       name: task.name,
//       description: task.description,
//       startDate: task.startDate,
//       endDate: task.endDate,
//       // ИСПРАВЛЕНО: Извлекаем ID из объекта responsiblePerson
//       responsiblePersonId: task.responsiblePerson?.id || null,
//       info: task.info,
//       isPriority: task.isPriority,
//       executionRequested: task.executionRequested,
//       executed: task.executed,
//       // ИСПРАВЛЕНО: Извлекаем массив ID из массива объектов dependsOn
//       dependsOnTaskIds: task.dependsOn?.map(dep => dep.id) || []
//     });
//     this.showEditTaskModal = true;
//     this.clearMessages();
//   }

//   closeEditTaskModal(): void {
//     this.showEditTaskModal = false;
//     this.currentTaskToEdit = null;
//     this.currentTaskParentStageId = null;
//     this.editTaskForm.reset();
//     this.clearMessages();
//   }

//   saveTaskChanges(): void {
//     this.clearMessages();
//     if (this.editTaskForm.invalid) {
//       this.editTaskForm.markAllAsTouched();
//       console.warn('[saveTaskChanges] Edit Task Form is invalid. Not submitting.');
//       this.setActionError('Пожалуйста, заполните все обязательные поля задачи.');
//       return;
//     }
//     if (!this.currentTaskToEdit || !this.currentTaskToEdit.id || this.currentTaskParentStageId === null) {
//       this.setActionError('Ошибка: Задача или родительский этап для редактирования не найдены.');
//       console.error('[saveTaskChanges] Current Task to Edit, its ID, or Parent Stage ID is missing. Cannot save changes.');
//       return;
//     }

//     const request: UpdateTaskRequest = this.editTaskForm.value;
//     console.log(`[saveTaskChanges] Attempting to update task ${this.currentTaskToEdit.id} for stage ${this.currentTaskParentStageId} with request:`, JSON.stringify(request, null, 2));

//     this.taskService.updateTask(this.currentTaskParentStageId, this.currentTaskToEdit.id, request).pipe(
//       catchError((err: HttpErrorResponse) => {
//         console.error('[saveTaskChanges] Error updating task:', err);
//         this.setActionError(`Не удалось обновить задачу: ${this.extractErrorMessage(err)}`);
//         return throwError(() => err);
//       })
//     ).subscribe({
//       next: (updatedTask) => {
//         console.log('[saveTaskChanges] Task updated on backend. Reloading schedule...');
//         this.closeEditTaskModal();
//         this.loadSchedule();
//         this.setSuccessMessage('Задача успешно обновлена!');
//       },
//       error: (err) => {
//         console.log('[saveTaskChanges] Task update subscription error handler triggered (already handled in catchError).');
//       }
//     });
//   }

//   confirmDeleteTask(taskId: number, parentStageId: number): void {
//     this.clearMessages();
//     this.confirmModalMessage = 'Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.';
//     this.confirmAction = () => this.deleteTask(taskId, parentStageId);
//     this.showConfirmModal = true;
//   }

//   deleteTask(taskId: number, parentStageId: number): void {
//     this.closeConfirmModal();
//     this.clearMessages();

//     if (parentStageId === null) {
//       this.setActionError('Ошибка: ID родительского этапа для задачи не найден. Невозможно удалить задачу.');
//       console.error('[deleteTask] Parent Stage ID is missing. Cannot delete task.');
//       return;
//     }

//     this.taskService.deleteTask(parentStageId, taskId).pipe(
//       catchError((err: HttpErrorResponse) => {
//         console.error('[deleteTask] Error deleting task:', err);
//         this.setActionError(`Не удалось удалить задачу: ${this.extractErrorMessage(err)}`);
//         return throwError(() => err);
//       })
//     ).subscribe({
//       next: () => {
//         console.log('[deleteTask] Task deleted on backend. Reloading schedule...');
//         this.loadSchedule();
//         this.setSuccessMessage('Задача успешно удалена!');
//       },
//       error: (err) => {
//         console.log('[deleteTask] Task deletion subscription error handler triggered (already handled in catchError).');
//       }
//     });
//   }


//   toggleStageExpansion(stage: StageResponse): void {
//     stage.expanded = !stage.expanded;
//   }

//   processDependsOnTaskIds(value: string): number[] {
//     if (!value) {
//       return [];
//     }
//     return value.split(',')
//                 .map(id => +id.trim())
//                 .filter(id => !isNaN(id));
//   }

//   private extractErrorMessage(err: HttpErrorResponse): string {
//     if (err.error instanceof ProgressEvent) {
//       return 'Ошибка сети: проверьте подключение.';
//     } else if (err.error && typeof err.error === 'object' && err.error.message) {
//       return err.error.message;
//     } else if (err.error && typeof err.error === 'object' && err.error.error) {
//       // Это может быть массив ошибок или строка/объект
//       if (Array.isArray(err.error.error) && err.error.error.length > 0) {
//         return err.error.error.map((e: any) => e.message || e.error || e).join('; ');
//       }
//       return err.error.error;
//     } else if (typeof err.error === 'string') {
//       return err.error;
//     }
//     return 'Неизвестная ошибка.';
//   }

//   // --- Функции кнопок в шапке ГПР ---

//   // Реализация для "Импортировать Excel"
//   importExcel(): void {
//     this.clearMessages();
//     this.fileInput.nativeElement.click(); // Открываем диалог выбора файла
//   }

//   onFileSelected(event: Event): void {
//     const element = event.currentTarget as HTMLInputElement;
//     let fileList: FileList | null = element.files;
//     if (fileList && fileList.length > 0) {
//       const file = fileList[0];
//       console.log('Selected file for upload:', file.name);

//       if (!this.projectId) {
//         this.setActionError('ID проекта не найден для импорта файла.');
//         return;
//       }

//       const formData = new FormData();
//       formData.append('file', file);

//       // Предполагаем, что scheduleService.addFileToSchedule принимает projectId и FormData
//       this.scheduleService.addFileToSchedule(this.projectId, formData).pipe(
//         catchError((err: HttpErrorResponse) => {
//           console.error('Error importing Excel file:', err);
//           this.setActionError(`Ошибка импорта файла Excel: ${this.extractErrorMessage(err)}`);
//           return throwError(() => err);
//         })
//       ).subscribe({
//         next: () => {
//           this.setSuccessMessage(`Файл "${file.name}" успешно импортирован!`);
//           this.loadSchedule(); // Перезагружаем расписание, чтобы увидеть изменения
//         },
//         error: (err) => {
//           // Ошибка уже обработана в catchError
//         }
//       });

//       // Очищаем input, чтобы можно было выбрать тот же файл снова
//       this.fileInput.nativeElement.value = '';
//     } else {
//       this.setActionError('Файл для импорта не выбран.');
//     }
//   }


//   // Новая логика для "Связать работы"
//   openLinkTasksModal(): void {
//     this.clearMessages();
//     this.showLinkTasksModal = true;
//     this.linkTaskError = null;
//     this.linkTaskSuccess = null;
//     this.selectedTaskToLink = null;
//     this.linkTasksForm.reset();
//     (this.linkTasksForm.get('selectedDependencies') as FormArray).clear(); // Очистить FormArray
//     // Убедимся, что allTasks актуален
//     this.updateAllTasksList();
//   }

//   closeLinkTasksModal(): void {
//     this.showLinkTasksModal = false;
//     this.linkTaskError = null;
//     this.linkTaskSuccess = null;
//     this.selectedTaskToLink = null;
//     this.linkTasksForm.reset();
//     (this.linkTasksForm.get('selectedDependencies') as FormArray).clear();
//   }

//   // При выборе задачи для связывания в модальном окне
//   onTaskToLinkChange(event: any): void {
//     const taskId = +event.target.value;
//     this.selectedTaskToLink = this.allTasks.find(t => t.id === taskId) || null;
//     this.linkTaskError = null;
//     this.linkTaskSuccess = null;

//     const selectedDependenciesFormArray = this.linkTasksForm.get('selectedDependencies') as FormArray;
//     selectedDependenciesFormArray.clear(); // Очистить предыдущие зависимости

//     if (this.selectedTaskToLink && this.selectedTaskToLink.dependsOnTaskIds) {
//       this.selectedTaskToLink.dependsOnTaskIds.forEach(depId => {
//         selectedDependenciesFormArray.push(new FormControl(depId));
//       });
//     }
//   }

//   // Геттер для удобного доступа к FormArray
//   get selectedDependenciesFormArray(): FormArray {
//     return this.linkTasksForm.get('selectedDependencies') as FormArray;
//   }

//   // Добавление/удаление зависимости через чекбокс
//   onDependencyCheckboxChange(event: any, depTaskId: number): void {
//     const selectedDependenciesFormArray = this.linkTasksForm.get('selectedDependencies') as FormArray;

//     if (event.target.checked) {
//       selectedDependenciesFormArray.push(new FormControl(depTaskId));
//     } else {
//       const index = selectedDependenciesFormArray.controls.findIndex(x => x.value === depTaskId);
//       if (index !== -1) {
//         selectedDependenciesFormArray.removeAt(index);
//       }
//     }
//   }

//   isDependencySelected(depTaskId: number): boolean {
//     return this.selectedDependenciesFormArray.value.includes(depTaskId);
//   }

//   // Сохранение изменений зависимостей
//   saveTaskLinks(): void {
//     this.linkTaskError = null;
//     this.linkTaskSuccess = null;

//     if (!this.selectedTaskToLink || !this.selectedTaskToLink.id) {
//       this.linkTaskError = 'Пожалуйста, выберите задачу, для которой нужно установить зависимости.';
//       return;
//     }

//     const parentStageId = this.schedule?.stages.find(s => s.tasks.some(t => t.id === this.selectedTaskToLink!.id))?.id;
//     if (!parentStageId) {
//       this.linkTaskError = 'Не удалось найти родительский этап для выбранной задачи.';
//       return;
//     }

//     // Собираем все текущие данные выбранной задачи, чтобы отправить их вместе с обновленными зависимостями
//     // Это важно, так как PUT-запрос обычно требует все поля объекта
//     const request: UpdateTaskRequest = {
//         name: this.selectedTaskToLink.name,
//         description: this.selectedTaskToLink.description,
//         startDate: this.selectedTaskToLink.startDate,
//         endDate: this.selectedTaskToLink.endDate,
//         // ИСПРАВЛЕНО: Используем ID из объекта responsiblePerson выбранной задачи
//         responsiblePersonId: this.selectedTaskToLink.responsiblePerson?.id || null,
//         info: this.selectedTaskToLink.info,
//         isPriority: this.selectedTaskToLink.isPriority,
//         executionRequested: this.selectedTaskToLink.executionRequested,
//         executed: this.selectedTaskToLink.executed,
//         // dependsOnTaskIds уже будет массивом чисел из FormArray
//         dependsOnTaskIds: this.selectedDependenciesFormArray.value
//     };

//     this.taskService.updateTask(parentStageId, this.selectedTaskToLink.id, request).pipe(
//       catchError((err: HttpErrorResponse) => {
//         console.error('Error updating task dependencies:', err);
//         this.linkTaskError = `Не удалось обновить связи задачи: ${this.extractErrorMessage(err)}`;
//         return throwError(() => err);
//       })
//     ).subscribe({
//       next: () => {
//         this.linkTaskSuccess = 'Зависимости задачи успешно обновлены!';
//         this.loadSchedule(); // Перезагружаем, чтобы обновить UI
//         // this.closeLinkTasksModal(); // Можно закрыть сразу или дать пользователю увидеть сообщение
//       },
//       error: (err) => {
//         // Ошибка уже обработана в catchError
//       }
//     });
//   }
//   // Конец новой логики для "Связать работы"

//   markAsPriority(task: TaskResponse): void {
//     this.clearMessages();
//     const stage = this.schedule?.stages.find(s => s.tasks.some(t => t.id === task.id));
//     if (!stage || !stage.id) {
//       console.error('Could not find parent stage for task:', task);
//       this.setActionError('Ошибка: Не удалось определить этап для задачи.');
//       return;
//     }

//     this.taskService.markAsPriority(stage.id, task.id).pipe(
//       catchError((err: HttpErrorResponse) => {
//         console.error('Error marking task as priority:', err);
//         this.setActionError(`Не удалось изменить приоритет задачи: ${this.extractErrorMessage(err)}`);
//         return throwError(() => err);
//       })
//     ).subscribe({
//       next: () => {
//         this.loadSchedule();
//         this.setSuccessMessage(`Приоритет задачи "${task.name}" изменен.`);
//       }
//     });
//   }

//   closeConfirmModal(): void {
//     this.showConfirmModal = false;
//     this.confirmModalMessage = '';
//     this.confirmAction = null;
//     this.clearMessages();
//   }

//   executeConfirmedAction(): void {
//     if (this.confirmAction) {
//       this.confirmAction();
//     }
//   }
// }

