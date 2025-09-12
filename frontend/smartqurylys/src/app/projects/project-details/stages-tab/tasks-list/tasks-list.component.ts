import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { TaskService } from '../../../../core/task.service';
import { TaskResponse, UpdateTaskRequest } from '../../../../core/models/task';
import { RequirementResponse } from '../../../../core/models/requirement';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { of, forkJoin, finalize, catchError, switchMap, tap } from 'rxjs';
// Импортируем ParticipantService и модель участника
import { ParticipantService } from '../../../../core/participant.service';
import { ParticipantResponse } from '../../../../core/models/participant'; // Предполагаемая модель, обновите при необходимости

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.css']
})
export class TasksListComponent implements OnInit, OnChanges {
  @Input() stageId!: number;
  @Input() stageName!: string;
  // Добавили новый @Input для получения ID проекта
  @Input() projectId!: number;
  @Output() close = new EventEmitter<void>();

  tasks: TaskResponse[] = [];
  // Добавили массив для хранения участников проекта
  participants: ParticipantResponse[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  showAddTaskModal = false;
  showEditTaskModal = false;
  showConfirmDeleteTaskModal = false;
  taskIdToDelete: number | null = null;

  showAddRequirementModal = false;
  currentTaskForAddRequirement: TaskResponse | null = null;

  showEditRequirementModal = false;
  editRequirementForm: FormGroup;
  currentRequirementForEdit: RequirementResponse | null = null;
  currentTaskForRequirementEdit: TaskResponse | null = null;

  showConfirmDeleteRequirementModal = false;
  requirementIdToDelete: number | null = null;
  taskIdForRequirementDelete: number | null = null;

  addTaskForm: FormGroup;
  editTaskForm: FormGroup;
  currentTaskForEdit: TaskResponse | null = null;

  addRequirementForm: FormGroup;

  private mimeTypeMap: { [key: string]: string } = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/zip': 'zip'
  };

  constructor(
    private taskService: TaskService,
    // Внедрили ParticipantService
    private participantService: ParticipantService,
    private fb: FormBuilder
  ) {
    this.addTaskForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      // Поле для ответственных лиц, остается таким же, так как оно уже массив
      responsiblePersonIds: [[]],
      info: [''],
      isPriority: [false],
      executionRequested: [false],
      executionConfirmed: [false],
      dependsOnTaskIds: [[]],
      requirements: this.fb.array([])
    });

    this.editTaskForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      responsiblePersonIds: [[]],
      info: [''],
      isPriority: [false],
      executionRequested: [false],
      executionConfirmed: [false],
      dependsOnTaskIds: [[]],
      requirements: this.fb.array([])
    });

    this.addRequirementForm = this.fb.group({
      description: ['', Validators.required],
      file: [null]
    });

    this.editRequirementForm = this.fb.group({
      description: ['', Validators.required],
      file: [null],
      removeSampleFile: [false] // Добавили опцию для удаления файла
    });
  }

  ngOnInit(): void {
    if (this.stageId) {
      this.loadTasks(this.stageId);
    }
    // Загружаем список участников проекта при инициализации компонента
    if (this.projectId) {
   console.log('ID проекта для загрузки участников:', this.projectId);
      this.loadParticipants(this.projectId);
    }
  }

ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId']) {
      const newProjectId = changes['projectId'].currentValue;
      console.log('ngOnChanges: Получено новое значение projectId:', newProjectId);

      // Проверяем, что projectId существует и является числом
      if (newProjectId && typeof newProjectId === 'number') {
        this.loadParticipants(newProjectId);
      }
    }
  }

  // Новый метод для загрузки участников
  loadParticipants(projectId: number): void {
    this.participantService.getParticipantsByProject(projectId).pipe(
      catchError((err: HttpErrorResponse) => {
        this.setActionMessage(`Не удалось загрузить участников проекта: ${err.message}`, 'error');
        return of([]);
      })
    ).subscribe(participants => {
      this.participants = participants;
    });
  }

  // Helper method for FormArray
  get requirementsFormArray(): FormArray {
    return this.addTaskForm.get('requirements') as FormArray;
  }
  
  get editRequirementsFormArray(): FormArray {
    return this.editTaskForm.get('requirements') as FormArray;
  }
  
  // Method to handle closing the component
  onClose(): void {
    this.close.emit();
  }

  // Loading and messaging
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

  loadTasks(stageId: number): void {
    this.isLoading = true;
    this.taskService.getTasksByStage(stageId).pipe(
      switchMap(tasks => {
        this.tasks = tasks;
        const reqObservables = tasks.map(task => 
          this.taskService.getRequirementsByTask(this.stageId, task.id!).pipe(
            tap(reqs => task.requirements = reqs),
            catchError(() => of([]))
          )
        );
        return forkJoin(reqObservables);
      }),
      catchError((err: HttpErrorResponse) => {
        this.setActionMessage(`Не удалось загрузить задачи: ${err.message}`, 'error');
        return of([]);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe(() => {});
  }

  // Add Task operations
  openAddTaskModal(): void {
    this.addTaskForm.reset();
    this.requirementsFormArray.clear();
    // Устанавливаем пустое значение для responsiblePersonIds
    this.addTaskForm.get('responsiblePersonIds')?.setValue([]);
    this.showAddTaskModal = true;
  }

  closeAddTaskModal(): void {
    this.showAddTaskModal = false;
    this.addTaskForm.reset();
    this.requirementsFormArray.clear();
    this.addTaskForm.get('responsiblePersonIds')?.setValue([]);
  }
  
  addRequirement(): void {
    this.requirementsFormArray.push(this.fb.group({
      description: ['', Validators.required],
      file: [null]
    }));
  }
  
  removeRequirement(index: number): void {
    this.requirementsFormArray.removeAt(index);
  }

  onFileChange(event: Event, requirementIndex: number): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.item(0);
    if (file) {
      this.requirementsFormArray.at(requirementIndex).patchValue({
        file: file
      });
    }
  }

  onFileChangeAddRequirement(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.item(0);
    if (file) {
      this.addRequirementForm.patchValue({
        file: file
      });
    }
  }

  onFileChangeEditRequirement(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.item(0);
    if (file) {
      this.editRequirementForm.patchValue({
        file: file
      });
    }
  }

  addTask(): void {
    if (this.addTaskForm.invalid) {
      this.addTaskForm.markAllAsTouched();
      this.setActionMessage('Пожалуйста, заполните все обязательные поля задачи.', 'error');
      return;
    }

    const formData = new FormData();
    const taskData: any = {};
    Object.keys(this.addTaskForm.controls).forEach(key => {
      if (key === 'requirements') {
        const requirements = this.requirementsFormArray.value.map((req: any) => ({
          description: req.description,
          sampleFile: req.file ? { id: null, name: req.file.name } : null
        }));
        taskData.requirements = requirements;

        this.requirementsFormArray.controls.forEach((reqGroup, index) => {
          const file = reqGroup.get('file')?.value;
          if (file) {
            formData.append(`requirementSampleFiles[${index}]`, file, file.name);
          }
        });
      } else {
        const value = this.addTaskForm.get(key)?.value;
        // Добавление responsiblePersonIds
        if (value !== null && value !== undefined && value !== '') {
          taskData[key] = value;
        }
      }
    });

    formData.append('taskData', new Blob([JSON.stringify(taskData)], { type: 'application/json' }));

    this.taskService.createTask(this.stageId, formData).pipe(
      catchError((err: HttpErrorResponse) => {
        this.setActionMessage(`Не удалось создать задачу: ${err.message}`, 'error');
        return of(null);
      })
    ).subscribe(task => {
      if (task) {
        this.closeAddTaskModal();
        this.loadTasks(this.stageId);
        this.setActionMessage('Задача успешно создана!', 'success');
      }
    });
  }

  // Edit Task operations
  openEditTaskModal(task: TaskResponse): void {
    this.currentTaskForEdit = task;
    this.editTaskForm.patchValue({
      id: task.id,
      name: task.name,
      description: task.description,
      startDate: task.startDate ? formatDate(task.startDate, 'yyyy-MM-dd', 'en') : '',
      endDate: task.endDate ? formatDate(task.endDate, 'yyyy-MM-dd', 'en') : '',
      info: task.info,
      isPriority: task.isPriority,
      executionRequested: task.executionRequested,
      executionConfirmed: task.executionConfirmed,
      responsiblePersons: task.responsiblePersons || [], // Заполняем ответственных
    });
    this.editRequirementsFormArray.clear();
    task.requirements?.forEach(req => {
      this.editRequirementsFormArray.push(this.fb.group({
        id: [req.id],
        description: [req.description, Validators.required],
        fileId: [req.sampleFile ? req.sampleFile.id : null],
        file: [null]
      }));
    });
    this.showEditTaskModal = true;
  }
  
  closeEditTaskModal(): void {
    this.showEditTaskModal = false;
    this.editTaskForm.reset();
    this.editRequirementsFormArray.clear();
    this.currentTaskForEdit = null;
  }
  
  updateTask(): void {
    if (this.editTaskForm.invalid || !this.currentTaskForEdit) {
      this.editTaskForm.markAllAsTouched();
      this.setActionMessage('Пожалуйста, заполните все обязательные поля задачи.', 'error');
      return;
    }

    const taskId = this.currentTaskForEdit.id!;
    const request: UpdateTaskRequest = this.editTaskForm.value;

    this.taskService.updateTask(this.stageId, taskId, request).pipe(
      catchError((err: HttpErrorResponse) => {
        this.setActionMessage(`Не удалось обновить задачу: ${err.message}`, 'error');
        return of(null);
      })
    ).subscribe(updatedTask => {
      if (updatedTask) {
        this.closeEditTaskModal();
        this.loadTasks(this.stageId);
        this.setActionMessage('Задача успешно обновлена!', 'success');
      }
    });
  }

  // Delete Task operation
  openConfirmDeleteTaskModal(taskId: number): void {
    this.taskIdToDelete = taskId;
    this.showConfirmDeleteTaskModal = true;
  }

  closeConfirmDeleteTaskModal(): void {
    this.showConfirmDeleteTaskModal = false;
    this.taskIdToDelete = null;
  }

  confirmDeleteTask(): void {
    if (this.taskIdToDelete) {
      this.taskService.deleteTask(this.stageId, this.taskIdToDelete).pipe(
        catchError((err: HttpErrorResponse) => {
          this.setActionMessage(`Не удалось удалить задачу: ${err.message}`, 'error');
          return of(null);
        })
      ).subscribe(() => {
        this.closeConfirmDeleteTaskModal();
        this.loadTasks(this.stageId);
        this.setActionMessage('Задача успешно удалена!', 'success');
      });
    }
  }

  // Requirement CRUD
  openAddRequirementModal(task: TaskResponse): void {
    this.currentTaskForAddRequirement = task;
    this.addRequirementForm.reset();
    this.showAddRequirementModal = true;
  }

  closeAddRequirementModal(): void {
    this.showAddRequirementModal = false;
    this.currentTaskForAddRequirement = null;
    this.addRequirementForm.reset();
  }

  addRequirementForTask(): void {
    if (this.addRequirementForm.invalid || !this.currentTaskForAddRequirement) {
      this.addRequirementForm.markAllAsTouched();
      this.setActionMessage('Пожалуйста, заполните описание требования.', 'error');
      return;
    }

    const taskId = this.currentTaskForAddRequirement.id!;
    const formData = new FormData();
    const requirementData = {
      description: this.addRequirementForm.get('description')?.value,
    };
    
    // Передаем JSON-данные как 'requirementData'
    formData.append('requirementData', new Blob([JSON.stringify(requirementData)], { type: 'application/json' }));
    
    // Передаем файл с его оригинальным именем
    const file = this.addRequirementForm.get('file')?.value;
    if (file) {
      formData.append('sampleFile', file, file.name);
    }
    
    this.taskService.createRequirement(this.stageId, taskId, formData).pipe(
      catchError((err: HttpErrorResponse) => {
        this.setActionMessage(`Не удалось добавить требование: ${err.message}`, 'error');
        return of(null);
      })
    ).subscribe(() => {
      this.closeAddRequirementModal();
      this.loadTasks(this.stageId);
      this.setActionMessage('Требование успешно добавлено!', 'success');
    });
  }

  openEditRequirementModal(task: TaskResponse, requirement: RequirementResponse): void {
    this.currentTaskForRequirementEdit = task;
    this.currentRequirementForEdit = requirement;
    this.editRequirementForm.patchValue({
      description: requirement.description,
      file: null,
      removeSampleFile: false
    });
    this.showEditRequirementModal = true;
  }

  closeEditRequirementModal(): void {
    this.showEditRequirementModal = false;
    this.currentTaskForRequirementEdit = null;
    this.currentRequirementForEdit = null;
    this.editRequirementForm.reset();
  }

  updateRequirement(): void {
    if (this.editRequirementForm.invalid || !this.currentRequirementForEdit || !this.currentTaskForRequirementEdit) {
      this.editRequirementForm.markAllAsTouched();
      this.setActionMessage('Пожалуйста, заполните описание требования.', 'error');
      return;
    }

    const requirementId = this.currentRequirementForEdit.id!;
    const formData = new FormData();
    const requirementData = {
      description: this.editRequirementForm.get('description')?.value,
      removeSampleFile: this.editRequirementForm.get('removeSampleFile')?.value
    };

    // Передаем JSON-данные как 'requirementData'
    formData.append('requirementData', new Blob([JSON.stringify(requirementData)], { type: 'application/json' }));
    
    // Передаем файл с его оригинальным именем
    const file = this.editRequirementForm.get('file')?.value;
    if (file) {
      formData.append('newSampleFile', file, file.name);
    }

    this.taskService.updateRequirement(this.stageId, requirementId, formData).pipe(
      catchError((err: HttpErrorResponse) => {
        this.setActionMessage(`Не удалось обновить требование: ${err.message}`, 'error');
        return of(null);
      })
    ).subscribe(() => {
      this.closeEditRequirementModal();
      this.loadTasks(this.stageId);
      this.setActionMessage('Требование успешно обновлено!', 'success');
    });
  }

  openConfirmDeleteRequirementModal(taskId: number, requirementId: number): void {
    this.taskIdForRequirementDelete = taskId;
    this.requirementIdToDelete = requirementId;
    this.showConfirmDeleteRequirementModal = true;
  }

  closeConfirmDeleteRequirementModal(): void {
    this.showConfirmDeleteRequirementModal = false;
    this.taskIdForRequirementDelete = null;
    this.requirementIdToDelete = null;
  }

  confirmDeleteRequirement(): void {
    if (this.taskIdForRequirementDelete && this.requirementIdToDelete) {
      this.taskService.deleteRequirement(this.stageId, this.requirementIdToDelete).pipe(
        catchError((err: HttpErrorResponse) => {
          this.setActionMessage(`Не удалось удалить требование: ${err.message}`, 'error');
          return of(null);
        })
      ).subscribe(() => {
        this.closeConfirmDeleteRequirementModal();
        this.loadTasks(this.stageId);
        this.setActionMessage('Требование успешно удалено!', 'success');
      });
    }
  }

  /**
   * Загружает файл по его ID с помощью TaskService,
   * извлекает имя файла из заголовка Content-Disposition,
   * а также пытается определить расширение по Content-Type,
   * и запускает его загрузку.
   * @param fileId ID файла.
   * @param filename Имя файла.
   */
  downloadFile(fileId: string | number, filename: string): void {
    this.taskService.downloadFile(fileId).subscribe({
      next: (response: HttpResponse<Blob>) => {
        const blob = response.body as Blob;
        const contentDisposition = response.headers.get('Content-Disposition');
        const contentType = response.headers.get('Content-Type');
        let finalFilename = filename;
        
        // Попытка извлечь имя файла из заголовка Content-Disposition
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch && filenameMatch.length > 1) {
            finalFilename = filenameMatch[1];
          }
        }
        
        // Проверка и корректировка расширения, если оно не соответствует MIME-типу
        const filenameParts = finalFilename.split('.');
        const existingExtension = filenameParts.length > 1 ? filenameParts.pop() : '';
        const expectedExtension = contentType ? this.mimeTypeMap[contentType] : null;

        if (expectedExtension && expectedExtension !== existingExtension) {
          finalFilename = `${filenameParts.join('.')}.${expectedExtension}`;
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.setActionMessage('Файл успешно загружен!', 'success');
      },
      error: (err) => {
        this.setActionMessage(`Не удалось загрузить файл: ${err.message}`, 'error');
      }
    });
  }
}
