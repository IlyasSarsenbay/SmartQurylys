import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, RouterModule, Router } from '@angular/router'; 
import { ProjectService } from './../core/project.service';
import { StageService } from './../core/stage.service';
import { ProjectResponse } from '../core/models/project';
import { ActivityLogResponse } from '../core/models/activity-log';
import { StageResponse } from '../core/models/stage';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActivityActionType, ActivityEntityType } from '../core/enums/activity-log.enum';
import { ModalComponent } from '../modal/modal.component';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../core/task.service';
import { TaskResponse } from '../core/models/task';
import { FileResponse } from '../core/models/file';
import { RequirementResponse } from '../core/models/requirement';
import { UserService } from '../core/user.service';
import { UserResponse } from '../core/models/user';
import { StageStatus } from '../core/enums/stage-status.enum';

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


  editableStageName: string = '';
  editableStageDescription: string = '';

  selectedTaskForEdit: TaskResponse | null = null;
  editableTaskName: string = '';
  editableTaskDescription: string = '';
  isTimelineModalOpen = false;
  isEditTimelineModalOpen = false;
  isStageMapModalOpen = false;
  isEditStageModalOpen = false;
  isAddRequirementModalOpen = false;
  isAddTaskModalOpen = false;

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
    { label: 'Документация', icon: 'document', view: 'documentation', active: false },
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
      }
    });
  }

  /**
   * Обрабатывает клики по элементам навигации.
   * Для 'project' выполняет внешнюю навигацию.
   * Для остальных элементов меняет локальный вид.
   */
  onNavItemClick(item: any): void {
    if (item.view === 'project') {
      this.router.navigate(['/project', this.projectId]);
    } else {
      this.currentView = item.view;
      this.navItems.forEach(navItem => navItem.active = (navItem.view === item.view));
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

 editStage(stageId: number): void {
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
}
