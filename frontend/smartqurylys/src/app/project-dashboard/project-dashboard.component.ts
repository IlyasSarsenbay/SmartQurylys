import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, RouterModule, Router } from '@angular/router'; 
import { ProjectService } from './../core/project.service';
import { StageService } from './../core/stage.service';
import { ProjectResponse } from '../core/models/project';
import { ActivityLogResponse } from '../core/models/activity-log';
import { StageResponse, UpdateStageRequest } from '../core/models/stage';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActivityActionType, ActivityEntityType } from '../core/enums/activity-log.enum';
import { ModalComponent } from '../modal/modal.component';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../core/task.service';
import { TaskResponse, CreateTaskRequest, UpdateTaskRequest } from '../core/models/task';
import { FileResponse } from '../core/models/file';
import { RequirementResponse } from '../core/models/requirement';
import { UserService } from '../core/user.service';
import { UserResponse } from '../core/models/user';
import { StageStatus } from '../core/enums/stage-status.enum';
import { ParticipantResponse } from '../core/models/participant';
import { ParticipantService } from './../core/participant.service'; 

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule, ModalComponent, FormsModule, RouterModule],
  templateUrl: './project-dashboard.component.html',
  styleUrl: './project-dashboard.component.css'
})
export class ProjectDashboardComponent implements OnInit {

  projectId!: number;
  scheduleId: number | null = null;

  project: ProjectResponse | null = null;
  stages: StageResponse[] = [];
  activityLog: ActivityLogResponse[] = [];
  currentView: string = 'stages'; 

  isEditStageModalOpen = false;
  isAddTaskModalOpen = false;
  hasCircularDependencyWarning: boolean = false;
  
  editableStageName: string = '';
  editableStageDescription: string = '';
  
  selectedTaskForEdit: TaskResponse | null = null;
  editableTaskName: string = '';
  editableTaskDescription: string = '';
  editableTaskStartDate: string = '';
  editableTaskEndDate: string = '';
  selectedParticipantIds: number[] = [];
  
  projectParticipants: ParticipantResponse[] = [];

   editableTaskPriority: boolean = false;
  availableDependencyTasks: TaskResponse[] = [];
  currentDependencies: TaskResponse[] = [];
  selectedDependencyIds: number[] = [];

  isTimelineModalOpen = false;
  isEditTimelineModalOpen = false;
  isStageMapModalOpen = false;
  isAddRequirementModalOpen = false;

  selectedStageForModal: StageResponse | null = null;
  editableStartDate: string = '';
  editableEndDate: string = '';

  tasks: TaskResponse[] = [];
  activeTask: TaskResponse | null = null;
  requirements: RequirementResponse[] = [];
  files: FileResponse[] = [];

  newRequirementDescription: string = '';
  newRequirementFileName: string = '';
  newRequirementFile: File | null = null;
  currentUserId: number | null = null;
  currentUserIinBin: string | null = null;
  isOwner = false;
  stageStatus = StageStatus;

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

  navItems = [
  { label: 'Этапы проекта', icon: 'list', view: 'stages', active: true },
  { label: 'Документация', icon: 'document', view: 'documents', active: false },
  { label: 'Направить уведомление', icon: 'notification', view: 'notifications', active: false },
  { label: 'Участники проекта', icon: 'users', view: 'users', active: false },
  { label: 'Чат', icon: 'chat', view: 'chat', active: false },
  { label: 'Проект', icon: 'project', view: 'project', active: false },
];

  constructor(
    private http: HttpClient,
    private projectService: ProjectService,
    private stageService: StageService,
    private taskService: TaskService,
    private participantService: ParticipantService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) { }
  

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = +params['id'];
      if (this.projectId) {
        this.fetchCurrentUser();
        this.fetchProjectDetails();
        this.fetchActivityLog();
        this.fetchProjectParticipants();
      }
    });
  }

  /**
   * Обрабатывает клики по элементам навигации.
   * Для 'project' выполняет внешнюю навигацию.
   * Для остальных элементов меняет локальный вид.
   */
 onNavItemClick(item: any): void {
  // Сбрасываем активность у всех элементов
  this.navItems.forEach(navItem => navItem.active = false);
  
  // Устанавливаем активность текущему элементу
  item.active = true;
  
  // Обрабатываем навигацию
  switch (item.view) {
    case 'project':
      this.router.navigate(['/project', this.projectId]);
      break;
    case 'documents':
      this.router.navigate(['/projects', this.projectId, 'documents']);
      break;
    default:
      // Для локальных представлений просто меняем currentView
      this.currentView = item.view;
      break;
  }
}
  // ... все остальные методы компонента остаются без изменений
  get isResponsible(): boolean {
    return this.activeTask?.responsiblePersons.some(p => p.iinBin === this.currentUserIinBin) || false;
  }

  fetchCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user: UserResponse) => {
        this.currentUserId = user.id;
        this.currentUserIinBin = user.iinBin;
        if (this.project && this.currentUserIinBin) {
          this.isOwner = this.currentUserIinBin === this.project.ownerIinBin;
        }
      },
      error: (error) => {
        console.error('Ошибка при загрузке текущего пользователя:', error);
      }
    });
  }

  fetchProjectDetails(): void {
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (data) => {
        this.project = data;
        if (this.project && this.project.schedule) {
            this.scheduleId = this.project.schedule.id;
        }
        if (this.project && this.currentUserIinBin) {
          this.isOwner = this.currentUserIinBin === this.project.ownerIinBin;
        }
        if (this.scheduleId !== null) {
            this.fetchProjectStages();
        }
      },
      error: (error) => {
        console.error('Ошибка при загрузке деталей проекта:', error);
      }
    });
  }


  fetchProjectStages(): void {
    if (this.scheduleId !== null) {
      this.stageService.getStages(this.scheduleId).subscribe({
        next: (data) => {
          this.stages = data.sort((a, b) => a.id - b.id);
        },
        error: (error) => {
          console.error('Ошибка при загрузке этапов проекта:', error);
        }
      });
    } else {
        console.warn('scheduleId не найден. Невозможно загрузить этапы.');
    }
  }

  fetchActivityLog(): void {
    const apiUrl = `${environment.apiUrl}/projects/${this.projectId}/activity-log`;
    this.http.get<ActivityLogResponse[]>(apiUrl)
      .pipe(
        catchError(error => {
          console.error('Ошибка при загрузке лога активности:', error);
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          this.activityLog = data;
        }
      });
  }

  fetchStageMapData(stageId: number): void {
    if (this.scheduleId === null) {
      console.error('scheduleId не найден. Невозможно загрузить данные карты этапа.');
      return;
    }

    // Находим выбранный этап, чтобы проверить его статус
    const selectedStage = this.stages.find(stage => stage.id === stageId);
    if (!selectedStage) {
      console.error('Выбранный этап не найден.');
      return;
    }

    this.taskService.getTasksByStage(stageId).subscribe({
      next: (tasks: TaskResponse[]) => {
        this.tasks = tasks;
        this.activeTask = tasks.length > 0 ? tasks[0] : null;

        if (this.activeTask) {
          // Если этап завершен, мы не загружаем требования и файлы, связанные с задачей
          if (selectedStage.status === StageStatus.COMPLETED) {
            this.files = []; 
            this.requirements = [];
          } else {
            forkJoin({
              requirements: this.taskService.getRequirementsByTask(this.scheduleId!, this.activeTask.id),
              files: this.taskService.getFilesByTask(this.scheduleId!, this.activeTask.id)
            }).subscribe({
              next: (results) => {
                this.requirements = results.requirements;
                this.files = results.files;
              },
              error: (error) => {
                console.error('Ошибка при загрузке требований и файлов:', error);
              }
            });
          }
        }
      },
      error: (error) => {
        console.error('Ошибка при загрузке задач:', error);
      }
    });
  }

getTaskById(taskId: number): TaskResponse | null {
  return this.tasks.find(task => task.id === taskId) || null;
}

  selectTask(task: TaskResponse): void {
    this.activeTask = task;
    if (this.selectedStageForModal && this.scheduleId !== null) {
      // Загружаем данные только если этап не завершен
      if (this.selectedStageForModal.status !== StageStatus.COMPLETED) {
        forkJoin({
          requirements: this.taskService.getRequirementsByTask(this.scheduleId, task.id),
          files: this.taskService.getFilesByTask(this.scheduleId, task.id)
        }).subscribe({
          next: (results) => {
            this.requirements = results.requirements;
            this.files = results.files;
          },
          error: (error) => {
            console.error('Ошибка при загрузке требований и файлов для новой задачи:', error);
          }
        });
      } else {
        // Если этап завершен, очищаем данные
        this.requirements = [];
        this.files = [];
      }
    }
  }

  handleStageAction(action: string, stage: StageResponse): void {
    this.selectedStageForModal = stage;
    switch (action) {
      case 'showTimeline':
        this.isTimelineModalOpen = true;
        break;
      case 'showMap':
        this.fetchStageMapData(stage.id);
        this.isStageMapModalOpen = true;
        break;
      case 'completeStage':
        this.completeStage(stage.id);
        break;
      case 'editStage':
        this.editStage(stage.id);
        this.isEditStageModalOpen = true;
        break;
      case 'returnStageToActive':
        this.returnStageToActive(stage.id);
        break;
      default:
        console.log(`Действие для этапа: ${action}`);
    }
  }

  closeModal(): void {
    this.isTimelineModalOpen = false;
    this.isEditTimelineModalOpen = false;
    this.isStageMapModalOpen = false;
    this.isAddRequirementModalOpen = false;
    this.selectedStageForModal = null;
    this.tasks = [];
    this.activeTask = null;
    this.requirements = [];
    this.files = [];
    this.newRequirementDescription = '';
  }

  getActivityActionText(type: string): string {
    switch (type as ActivityActionType) {
      case ActivityActionType.REQUEST_ACCEPTANCE:
        return 'просит принять исполнение';
      case ActivityActionType.ACCEPTED_ACCEPTANCE:
        return 'принято исполнение';
      case ActivityActionType.REJECTED_ACCEPTANCE:
        return 'отклонено исполнение';
      case ActivityActionType.PROJECT_UPDATED:
        return 'обновил проект';
      case ActivityActionType.STAGE_UPDATED:
        return 'обновил этап';
      case ActivityActionType.STAGE_DELETED:
        return 'удалил этап';
      case ActivityActionType.FILE_ADDED:
        return 'добавил файл';
      case ActivityActionType.FILE_DELETED:
        return 'удалил файл';
      default:
        return 'выполнил действие';
    }
  }

  getActivityEntityText(type: string): string {
    switch (type as ActivityEntityType) {
      case ActivityEntityType.PROJECT:
        return '';
      case ActivityEntityType.STAGE:
        return 'в этап';
      case ActivityEntityType.FILE:
        return '';
      default:
        return '';
    }
  }

  getProgressPercentage(stage: StageResponse): number {
    if (!stage || !stage.startDate || !stage.endDate) {
      return 0;
    }
    // Если статус COMPLETED, всегда показываем 100%
    if (stage.status === StageStatus.COMPLETED) {
      return 100;
    }

    const start = new Date(stage.startDate).getTime();
    const end = new Date(stage.endDate).getTime();
    const now = new Date().getTime();

    if (now < start) {
      return 0;
    }
    if (now > end) {
      return 100;
    }

    const totalDuration = end - start;
    const elapsedDuration = now - start;

    return Math.min(100, Math.floor((elapsedDuration / totalDuration) * 100));
  }

  getStrokeDasharray(stage: StageResponse): string {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    return `${circumference} ${circumference}`;
  }

  getStrokeDashoffset(stage: StageResponse): number {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const percentage = this.getProgressPercentage(stage);
    return circumference - (percentage / 100) * circumference;
  }

  openEditTimelineModal(): void {
    if (this.selectedStageForModal) {
      this.editableStartDate = this.selectedStageForModal.startDate ?? '';
      this.editableEndDate = this.selectedStageForModal.endDate ?? '';
      this.isEditTimelineModalOpen = true;
    }
  }

  closeEditTimelineModal(): void {
    this.isEditTimelineModalOpen = false;
  }

  saveTimelineChanges(): void {
    if (this.selectedStageForModal && this.editableStartDate && this.editableEndDate && this.scheduleId !== null) {
        const updateRequest = {
            name: this.selectedStageForModal.name,
            startDate: this.editableStartDate,
            endDate: this.editableEndDate,
            info: this.selectedStageForModal.description,
            status: this.selectedStageForModal.status
        };
        this.stageService.updateStage(this.scheduleId, this.selectedStageForModal.id, updateRequest).subscribe({
            next: () => {
                this.closeEditTimelineModal();
                this.closeModal();
                this.fetchProjectStages();
            },
            error: (error) => {
                console.error('Ошибка при обновлении этапа:', error);
            }
        });
    }
  }

  requestAcceptance(): void {
    if (this.activeTask && this.scheduleId !== null) {
      this.taskService.requestExecution(this.scheduleId, this.activeTask.id).subscribe({
        next: () => {
          this.activeTask!.executionRequested = true;
          if (this.selectedStageForModal) {
            this.fetchStageMapData(this.selectedStageForModal.id);
          }
        },
        error: (error) => {
          console.error('Ошибка при отправке запроса на принятие исполнения:', error);
        }
      });
    }
  }

  confirmExecution(): void {
    if (this.activeTask && this.scheduleId !== null) {
      this.taskService.confirmExecution(this.scheduleId, this.activeTask.id).subscribe({
        next: () => {
          this.activeTask!.executionConfirmed = true;
          if (this.selectedStageForModal) {
            this.fetchStageMapData(this.selectedStageForModal.id);
          }
        },
        error: (error) => {
          console.error('Ошибка при принятии исполнения:', error);
        }
      });
    }
  }

  rejectExecution(): void {
    if (this.activeTask && this.scheduleId !== null) {
      this.taskService.declineExecution(this.scheduleId, this.activeTask.id).subscribe({
        next: () => {
          if (this.selectedStageForModal) {
            this.fetchStageMapData(this.selectedStageForModal.id);
          }
        },
        error: (error) => {
          console.error('Ошибка при отказе принять исполнения:', error);
        }
      });
    }
  }

  downloadFile(file: FileResponse): void {
    this.taskService.downloadFile(file.id).subscribe({
      next: (response: HttpResponse<Blob>) => {
        const blob = response.body as Blob;
        const contentDisposition = response.headers.get('Content-Disposition');
        const contentType = response.headers.get('Content-Type');
        let finalFilename = file.name;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch && filenameMatch.length > 1) {
            finalFilename = filenameMatch[1];
          }
        }

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
      },
      error: (err) => {
        console.error('Не удалось загрузить файл:', err);
      }
    });
  }

  addFileToTask(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.scheduleId !== null && this.activeTask) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('file', file, file.name);

      this.taskService.addFileToTask(this.scheduleId, this.activeTask.id, formData).pipe(
        catchError(error => {
          console.error('Ошибка при загрузке файла:', error);
          return of(null);
        })
      ).subscribe(() => {
        input.value = '';
        this.taskService.getFilesByTask(this.scheduleId!, this.activeTask!.id).subscribe({
          next: (files) => this.files = files,
          error: (error) => console.error('Ошибка при загрузке файлов:', error)
        });
      });
    }
  }

  openAddRequirementModal(): void {
    this.isAddRequirementModalOpen = true;
  }

  closeAddRequirementModal(): void {
    this.isAddRequirementModalOpen = false;
    this.newRequirementDescription = '';
    this.newRequirementFileName = '';
    this.newRequirementFile = null;
  }

  handleRequirementFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.newRequirementFile = file;
      this.newRequirementFileName = file.name;
    }
  }

  addRequirement(): void {
    if (this.scheduleId !== null && this.activeTask && this.newRequirementDescription) {
      const formData = new FormData();
      const requirementData = {
        description: this.newRequirementDescription
      };

      formData.append('requirementData', new Blob([JSON.stringify(requirementData)], { type: 'application/json' }));
      
      if (this.newRequirementFile) {
        formData.append('sampleFile', this.newRequirementFile, this.newRequirementFile.name);
      }

      this.taskService.createRequirement(this.scheduleId, this.activeTask.id, formData).pipe(
        catchError(error => {
          console.error('Ошибка при создании требования:', error);
          return of(null);
        })
      ).subscribe((newRequirement) => {
        if (newRequirement) {
          this.closeAddRequirementModal();
          this.taskService.getRequirementsByTask(this.scheduleId!, this.activeTask!.id).subscribe({
            next: (requirements) => this.requirements = requirements,
            error: (error) => console.error('Ошибка при загрузке требований:', error)
          });
        }
      });
    }
  }

  completeStage(stageId: number): void {
    if (this.scheduleId !== null) {
      this.stageService.completeStage(this.scheduleId, stageId).subscribe({
        next: () => {
          this.fetchProjectStages();
          this.closeModal();
        },
        error: (error) => {
          console.error('Ошибка при завершении этапа:', error);
        }
      });
    }
  }

  returnStageToActive(stageId: number): void {
    if (this.scheduleId !== null) {
      this.stageService.returnStageToActive(this.scheduleId, stageId).subscribe({
        next: () => {
          this.fetchProjectStages();
          this.closeModal();
        },
        error: (error) => {
          console.error('Ошибка при возврате этапа в работу:', error);
        }
      });
    }
  }

editStage(stageId: number): void {
    const stage = this.stages.find(s => s.id === stageId);
    if (stage) {
      this.selectedStageForModal = stage;
      this.editableStageName = stage.name;
      this.editableStageDescription = stage.description || '';
      this.editableStartDate = stage.startDate || '';
      this.editableEndDate = stage.endDate || '';
      this.isEditStageModalOpen = true;
      
      // Загружаем задачи этапа
      this.fetchStageTasks(stageId);
    }
  }

  closeEditStageModal(): void {
    this.isEditStageModalOpen = false;
    this.selectedStageForModal = null;
    this.tasks = [];
  }

  saveStageChanges(): void {
    if (this.selectedStageForModal && this.scheduleId !== null) {
      const updateRequest: UpdateStageRequest = {
        name: this.editableStageName,
        description: this.editableStageDescription,
        startDate: this.editableStartDate,
        endDate: this.editableEndDate,
        status: this.selectedStageForModal.status
      };

      this.stageService.updateStage(this.scheduleId, this.selectedStageForModal.id, updateRequest)
        .subscribe({
          next: (updatedStage) => {
            // Обновляем этап в массиве
            const index = this.stages.findIndex(s => s.id === updatedStage.id);
            if (index !== -1) {
              this.stages[index] = updatedStage;
            }
            this.closeEditStageModal();
          },
          error: (error) => {
            console.error('Ошибка при обновлении этапа:', error);
          }
        });
    }
  }

  // Методы для работы с задачами
fetchStageTasks(stageId: number): void {
  this.taskService.getTasksByStage(stageId).subscribe({
    next: (tasks: TaskResponse[]) => {
      this.tasks = tasks;
      
      // Если редактируем задачу, обновляем её зависимости
      if (this.selectedTaskForEdit) {
        const updatedTask = tasks.find(t => t.id === this.selectedTaskForEdit!.id);
        if (updatedTask) {
          this.selectedTaskForEdit = updatedTask;
          this.loadTaskDependencies(updatedTask);
        }
      }
    },
    error: (error) => {
      console.error('Ошибка при загрузке задач этапа:', error);
    }
  });
}

  fetchProjectParticipants(): void {
    if (this.projectId) {
    this.participantService.getParticipantsByProject(this.projectId).subscribe({
      next: (participants: ParticipantResponse[]) => {
        this.projectParticipants = participants;
      },
      error: (error) => {
        console.error('Ошибка при загрузке участников проекта:', error);
      }
    });
  }
  }

  openAddTaskModal(): void {
    this.selectedTaskForEdit = null;
    this.editableTaskName = '';
    this.editableTaskDescription = '';
    this.editableTaskStartDate = '';
    this.editableTaskEndDate = '';
    this.selectedParticipantIds = [];
    this.isAddTaskModalOpen = true;
  }

  closeAddTaskModal(): void {
    this.isAddTaskModalOpen = false;
    this.selectedTaskForEdit = null;
  }

 editTask(task: TaskResponse): void {
  
  this.selectedTaskForEdit = task;
  this.editableTaskName = task.name;
  this.editableTaskDescription = task.description || '';
  this.editableTaskStartDate = task.startDate || '';
  this.editableTaskEndDate = task.endDate || '';
  this.selectedParticipantIds = task.responsiblePersons.map(p => p.id);
  
  // Перезагружаем задачи этапа, чтобы получить актуальные данные с зависимостями
  if (this.selectedStageForModal) {
    this.fetchStageTasks(this.selectedStageForModal.id);
  }
  
  this.isAddTaskModalOpen = true;
}

   
loadTaskDependencies(task: TaskResponse): void {
  
  // Используем dependsOnTasks из задачи, если они есть
  if (task.dependsOnTasks) {
    this.currentDependencies = task.dependsOnTasks;
  } else {
    // Если dependsOnTasks нет, пробуем найти зависимости в локальном массиве tasks
    this.currentDependencies = this.tasks.filter(t => 
      task.dependsOnTaskIds?.includes(t.id)
    ) || [];
  }
  
  this.selectedDependencyIds = this.currentDependencies.map(dep => dep.id);
  
  // Загружаем доступные задачи
  this.loadAvailableDependencyTasks(task.id);
}
// Принудительная загрузка зависимостей задачи
loadTaskDependenciesWithAPI(taskId: number): void {
  if (this.selectedStageForModal) {
    this.taskService.getTasksByStage(this.selectedStageForModal.id).subscribe({
      next: (tasks: TaskResponse[]) => {
        const taskWithDeps = tasks.find(t => t.id === taskId);
        if (taskWithDeps) {
          this.loadTaskDependencies(taskWithDeps);
        }
      },
      error: (error) => {
        console.error('Ошибка при загрузке зависимостей:', error);
      }
    });
  }
}
  // Загрузка доступных задач для зависимостей
loadAvailableDependencyTasks(currentTaskId: number): void {
  
  if (this.selectedStageForModal) {
    this.taskService.getTasksByStage(this.selectedStageForModal.id).subscribe({
      next: (tasks: TaskResponse[]) => {
        
        // Исключаем текущую задачу
        this.availableDependencyTasks = tasks.filter(task => 
          task.id !== currentTaskId
        );
        
      },
      error: (error) => {
        console.error('Ошибка при загрузке доступных задач:', error);
      }
    });
  }
}

  // Проверка, является ли задача зависимостью
  isTaskDependency(taskId: number): boolean {
  const isDependency = this.selectedDependencyIds.includes(taskId);
  return isDependency;
}

   canAddDependency(task: TaskResponse): boolean {
    if (!this.selectedTaskForEdit) return true;
    
    // Проверяем, не создаст ли это циклическую зависимость
    if (this.wouldCreateCircularDependency(task.id)) {
      return false;
    }
    
    // Проверяем, не зависит ли уже эта задача от текущей
    if (task.dependsOnTaskIds?.includes(this.selectedTaskForEdit.id)) {
      return false;
    }
    
    return true;
  }

  // Проверка на циклические зависимости
 wouldCreateCircularDependency(taskId: number): boolean {
  if (!this.selectedTaskForEdit) return false;
  
  // Если задача уже зависит от текущей задачи - это циклическая зависимость
  const targetTask = this.tasks.find(t => t.id === taskId);
  if (targetTask?.dependsOnTaskIds?.includes(this.selectedTaskForEdit.id)) {
    return true;
  }
  
  // Рекурсивная проверка через все зависимости
  const checkDependencies = (currentTaskId: number, visited: Set<number> = new Set()): boolean => {
    if (visited.has(currentTaskId)) return true;
    if (currentTaskId === this.selectedTaskForEdit!.id) return true;
    
    visited.add(currentTaskId);
    
    const task = this.tasks.find(t => t.id === currentTaskId);
    if (!task || !task.dependsOnTaskIds || task.dependsOnTaskIds.length === 0) {
      return false;
    }
    
    // Проверяем все зависимости текущей задачи
    for (const depId of task.dependsOnTaskIds) {
      if (checkDependencies(depId, new Set(visited))) {
        return true;
      }
    }
    
    return false;
  };
  
  return checkDependencies(taskId);
}

// Получение цепочки зависимостей
getDependencyChain(): TaskResponse[] {
  if (!this.selectedTaskForEdit) return [];
  
  const chain: TaskResponse[] = [];
  const visited = new Set<number>();
  
  const buildChain = (taskId: number) => {
    if (visited.has(taskId)) return;
    visited.add(taskId);
    
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      chain.unshift(task);
      
      // Добавляем зависимости этой задачи
      if (task.dependsOnTaskIds && task.dependsOnTaskIds.length > 0) {
        task.dependsOnTaskIds.forEach(depId => buildChain(depId));
      }
    }
  };
  
  // Строим цепочку от текущей задачи через все зависимости
  buildChain(this.selectedTaskForEdit.id);
  return chain;
}

// Получение доступных зависимостей со статусом
getAvailableDependenciesWithStatus(): any[] {
  if (!this.availableDependencyTasks) return [];
  
  // Фильтруем задачи, которые уже являются зависимостями
  return this.availableDependencyTasks
    .filter(task => !this.isTaskDependency(task.id))
    .map(task => ({
      ...task,
      canAdd: this.canAddDependency(task),
      blockReason: this.getDependencyBlockReason(task)
    }));
}
// Получение причины блокировки зависимости
getDependencyBlockReason(task: TaskResponse): string {
  if (!this.selectedTaskForEdit) return '';
  
  if (this.wouldCreateCircularDependency(task.id)) {
    return 'Создает циклическую зависимость';
  }
  
  if (task.dependsOnTaskIds?.includes(this.selectedTaskForEdit.id)) {
    return 'Эта задача уже зависит от текущей';
  }
  
  if (task.executionConfirmed) {
    return 'Задача уже выполнена';
  }
  
  return 'Невозможно добавить зависимость';
}

// Проверка возможности выполнения задачи на основе зависимостей
canExecuteTask(task: TaskResponse): boolean {
  if (!task.dependsOnTaskIds || task.dependsOnTaskIds.length === 0) {
    return true;
  }
  
  // Проверяем, все ли зависимости выполнены
  return task.dependsOnTaskIds.every(depId => {
    const depTask = this.tasks.find(t => t.id === depId);
    return depTask?.executionConfirmed || false; 
  });
}

  // Валидация формы
  isTaskFormValid(): boolean {
    return !!this.editableTaskName.trim() && 
           !!this.editableTaskStartDate && 
           !!this.editableTaskEndDate &&
           this.selectedParticipantIds.length > 0;
  }

 // Переключение зависимости
toggleDependency(taskId: number, event: any): void {
  const task = this.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (event.target.checked) {
    // Проверяем возможность добавления
    if (!this.canAddDependency(task)) {
      event.target.checked = false;
      this.hasCircularDependencyWarning = true;
      setTimeout(() => {
        this.hasCircularDependencyWarning = false;
      }, 3000);
      return;
    }
    
    this.addDependency(taskId);
  } else {
    this.removeDependency(taskId);
  }
}

  // Добавление зависимости
addDependency(dependencyTaskId: number): void {
  if (this.selectedStageForModal && this.selectedTaskForEdit) {
    this.taskService.addDependency(
      this.selectedStageForModal.id,
      this.selectedTaskForEdit.id,
      dependencyTaskId
    ).subscribe({
      next: () => {
        // Обновляем список зависимостей
        const dependencyTask = this.tasks.find(t => t.id === dependencyTaskId);
        if (dependencyTask && !this.currentDependencies.some(dep => dep.id === dependencyTaskId)) {
          this.currentDependencies.push(dependencyTask);
          this.selectedDependencyIds.push(dependencyTaskId);
          
          // Удаляем из доступных задач
          this.availableDependencyTasks = this.availableDependencyTasks.filter(t => t.id !== dependencyTaskId);
        }
      },
      error: (error) => {
        console.error('Ошибка при добавлении зависимости:', error);
        alert('Не удалось добавить зависимость: ' + error.message);
      }
    });
  }
}

  // Удаление зависимости
removeDependency(dependencyTaskId: number): void {
  if (this.selectedStageForModal && this.selectedTaskForEdit) {
    this.taskService.removeDependency(
      this.selectedStageForModal.id,
      this.selectedTaskForEdit.id,
      dependencyTaskId
    ).subscribe({
      next: () => {
        // Удаляем из локального массива
        this.currentDependencies = this.currentDependencies.filter(dep => dep.id !== dependencyTaskId);
        this.selectedDependencyIds = this.selectedDependencyIds.filter(id => id !== dependencyTaskId);
        
        // Добавляем задачу обратно в доступные
        const dependencyTask = this.tasks.find(t => t.id === dependencyTaskId);
        if (dependencyTask && !this.availableDependencyTasks.some(t => t.id === dependencyTaskId)) {
          this.availableDependencyTasks.push(dependencyTask);
        }
      },
      error: (error) => {
        console.error('Ошибка при удалении зависимости:', error);
        alert('Не удалось удалить зависимость: ' + error.message);
      }
    });
  }
}

// Обновление данных при редактировании задачи
refreshDependencies(): void {
  if (this.selectedTaskForEdit) {
    this.loadTaskDependencies(this.selectedTaskForEdit);
    this.loadAvailableDependencyTasks(this.selectedTaskForEdit.id);
  }
}

  // Отметка задачи как приоритетной
  markAsPriority(): void {
    if (this.selectedStageForModal && this.selectedTaskForEdit) {
      this.taskService.markAsPriority(
        this.selectedStageForModal.id,
        this.selectedTaskForEdit.id
      ).subscribe({
        next: () => {
          this.editableTaskPriority = true;
          // Обновляем задачу в списке
          const taskIndex = this.tasks.findIndex(t => t.id === this.selectedTaskForEdit!.id);
          if (taskIndex !== -1) {
            this.tasks[taskIndex].isPriority = true;
          }
        },
        error: (error) => {
          console.error('Ошибка при установке приоритета:', error);
          alert('Не удалось установить приоритет: ' + error.message);
        }
      });
    }
  }

  isParticipantSelected(participantId: number): boolean {
    return this.selectedParticipantIds.includes(participantId);
  }

  toggleParticipantSelection(participantId: number, event: any): void {
    if (event.target.checked) {
      this.selectedParticipantIds.push(participantId);
    } else {
      this.selectedParticipantIds = this.selectedParticipantIds.filter(id => id !== participantId);
    }
  }

  saveTask(): void {
    if (!this.selectedStageForModal) return;

  // Проверяем зависимости перед сохранением
  const unresolvedDependencies = this.currentDependencies.filter(dep => !dep.executionConfirmed);
  if (unresolvedDependencies.length > 0 && !confirm(
    `Некоторые зависимости не выполнены. Задача может быть заблокирована. Продолжить сохранение?`
  )) {
    return;
  }

    if (!this.editableTaskName.trim()) {
      alert('Название задачи обязательно для заполнения');
      return;
    }

    if (this.selectedTaskForEdit) {
      // Редактирование существующей задачи
      const updateRequest: UpdateTaskRequest = {
        name: this.editableTaskName,
        description: this.editableTaskDescription,
        startDate: this.editableTaskStartDate,
        endDate: this.editableTaskEndDate,
        responsiblePersonIds: this.selectedParticipantIds,
        info: this.selectedTaskForEdit.info || '',
        isPriority: this.editableTaskPriority,
        executionRequested: this.selectedTaskForEdit.executionRequested,
        executed: this.selectedTaskForEdit.executionConfirmed,
        dependsOnTaskIds: this.selectedDependencyIds,
        requirements: []
      };

       this.taskService.updateTask(this.selectedStageForModal.id, this.selectedTaskForEdit.id, updateRequest)
        .subscribe({
          next: (updatedTask) => {
            // Обновляем задачу в массиве
            const index = this.tasks.findIndex(t => t.id === updatedTask.id);
            if (index !== -1) {
              this.tasks[index] = updatedTask;
            }
            this.closeAddTaskModal();
          },
          error: (error) => {
            console.error('Ошибка при обновлении задачи:', error);
            alert('Ошибка при обновлении задачи: ' + error.message);
          }
        });
    } else {
      // Создание новой задачи
      const createRequest: CreateTaskRequest = {
        name: this.editableTaskName,
        description: this.editableTaskDescription,
        startDate: this.editableTaskStartDate,
        endDate: this.editableTaskEndDate,
        responsiblePersonIds: this.selectedParticipantIds,
        info: '',
        isPriority: this.editableTaskPriority,
        executionRequested: false,
        executed: false,
        dependsOnTaskIds: this.selectedDependencyIds,
        requirements: []
      };

      this.taskService.createTask2(this.selectedStageForModal.id, createRequest)
        .subscribe({
          next: (newTask) => {
            this.tasks.push(newTask);
            this.closeAddTaskModal();
          },
          error: (error) => {
            console.error('Ошибка при создании задачи:', error);
            alert('Ошибка при создании задачи: ' + error.message);
          }
        });
    }
  }

  deleteTask(taskId: number): void {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      this.taskService.deleteTask(this.selectedStageForModal!.id, taskId)
        .subscribe({
          next: () => {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
          },
          error: (error) => {
            console.error('Ошибка при удалении задачи:', error);
          }
        });
    }
  }

}
