import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProjectService } from '../../core/project.service';
import { ProjectResponse } from '../../core/models/project';
import { Observable, of, switchMap } from 'rxjs';
import { catchError, tap, take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CreateInvitationRequest, UpdateProjectRequest, UpdateParticipantRequest } from '../../core/models/project-requests';
import { InvitationResponse } from '../../core/models/project-invitation';
import { FileResponse } from '../../core/models/file';
import { ParticipantResponse } from '../../core/models/participant';
import { ParticipantService } from '../../core/participant.service';
import { environment } from '../../../environments/environment';
import { GprTabComponent } from './gpr-tab/gpr-tab.component';
import { City } from '../../core/models/city';
import { CityService } from '../../core/city.service';
import { ProjectStatus } from "../../core/enums/project-status.enum"; 


@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    GprTabComponent
  ],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css']
})
export class ProjectDetailsComponent implements OnInit {
  projectId: number | null = null;
  project$: Observable<ProjectResponse | null>;
  participants$: Observable<ParticipantResponse[]>;
  invitationForm: FormGroup;
  uploadFileForm: FormGroup;
  projectFiles$: Observable<FileResponse[]>;

  projectEditForm: FormGroup;
  isEditingProject: boolean = false;

  showEditParticipantModal: boolean = false;
  editParticipantForm: FormGroup;
  currentParticipantToEdit: ParticipantResponse | null = null;
  editParticipantErrorMessage: string = '';
  editParticipantSuccessMessage: string = '';

  activeTab: 'info' | 'contract' | 'estimate' | 'gpr' = 'info';
  showInviteForm: boolean = false;
  showUploadForm: boolean = false;

  errorMessage: string = '';
  successMessage: string = '';
  invitationErrorMessage: string = '';
  invitationSuccessMessage: string = '';
  fileUploadErrorMessage: string = '';
  fileUploadSuccessMessage: string = '';

  showConfirmModal: boolean = false;
  confirmModalMessage: string = '';
  confirmAction: (() => void) | null = null;

  cities$: Observable<City[]>;
  get projectStatusValues(): string[] {
    return Object.values(ProjectStatus);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private participantService: ParticipantService,
    private fb: FormBuilder,
    private cityService: CityService
  ) {
    this.project$ = of(null);
    this.participants$ = of([]);
    this.projectFiles$ = of([]);

    this.cities$ = this.cityService.getAllCities().pipe(
      catchError(error => {
        console.error('Error fetching cities:', error);
        this.errorMessage = 'Не удалось загрузить список городов.';
        return of([]);
      })
    );

    this.invitationForm = this.fb.group({
      iinBin: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      role: ['', Validators.required],
      canUploadDocuments: [false],
      canSendNotifications: [false]
    });

    this.uploadFileForm = this.fb.group({
      file: [null, Validators.required]
    });

    this.projectEditForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      type: ['', Validators.required],
      cityId: ['', Validators.required],
      status: ['', Validators.required], // <-- Используем ProjectStatus enum
      startDate: ['', Validators.required], // <-- ДОБАВЛЕНО: Поле даты начала с валидатором
      endDate: ['', Validators.required]
    });


    this.editParticipantForm = this.fb.group({
      role: ['', Validators.required],
      canUploadDocuments: [false],
      canSendNotifications: [false]
    });


    this.project$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.projectId = +id;
          this.loadProjectData();
          return this.projectService.getProjectById(this.projectId).pipe(
            tap(project => {
              if (project) {
                this.projectEditForm.patchValue({
                  name: project.name,
                  description: project.description,
                  type: project.type,
                  status: project.status, // <-- Заполнение статуса из project
                  startDate: project.startDate, // <-- Заполнение даты начала из project
                  endDate: project.endDate
                });

                this.cities$.pipe(take(1)).subscribe(cities => {
                    const foundCity = cities.find(city => city.name === project.cityName);
                    if (foundCity) {
                        this.projectEditForm.patchValue({
                            cityId: foundCity.id
                        });
                    } else {
                        console.warn(`City ID not found for city name: "${project.cityName}". Please select a city.`);
                        this.projectEditForm.patchValue({ cityId: null });
                    }
                });
              }
            }),
            catchError(error => {
              console.error('Error fetching project details:', error);
              this.errorMessage = 'Не удалось загрузить детали проекта.';
              return of(null);
            })
          );
        }
        this.errorMessage = 'ID проекта не указан.';
        return of(null);
      })
    );
  }

  ngOnInit(): void { }

  private loadProjectData(): void {
    if (this.projectId) {
      this.projectFiles$ = this.projectService.getProjectFiles(this.projectId).pipe(
        catchError(error => {
          console.error('Error fetching project files:', error);
          this.fileUploadErrorMessage = 'Не удалось загрузить файлы проекта.';
          return of([]);
        })
      );
      this.participants$ = this.participantService.getParticipantsByProject(this.projectId).pipe(
        catchError(error => {
          console.error('Error fetching project participants:', error);
          this.invitationErrorMessage = 'Не удалось загрузить участников проекта.';
          return of([]);
        })
      );
    }
  }

  setActiveTab(tab: 'info' | 'contract' | 'estimate' | 'gpr'): void {
    this.activeTab = tab;
    this.invitationErrorMessage = '';
    this.invitationSuccessMessage = '';
    this.fileUploadErrorMessage = '';
    this.fileUploadSuccessMessage = '';
    this.showInviteForm = false;
    this.showUploadForm = false;
    this.isEditingProject = false;
  }

  toggleEditProject(): void {
    this.isEditingProject = !this.isEditingProject;
    if (this.isEditingProject) {
      this.project$.pipe(take(1)).subscribe(project => {
        if (project) {
          this.projectEditForm.patchValue({
            name: project.name,
            description: project.description,
            type: project.type,
            status: project.status, // <-- Заполнение статуса при открытии формы
            startDate: project.startDate, // <-- Заполнение даты начала при открытии формы
            endDate: project.endDate
          });
          this.cities$.pipe(take(1)).subscribe(cities => {
              const foundCity = cities.find(city => city.name === project.cityName);
              if (foundCity) {
                  this.projectEditForm.patchValue({
                      cityId: foundCity.id
                  });
              } else {
                  console.warn(`City ID not found for city name: "${project.cityName}". Please select a city.`);
                  this.projectEditForm.patchValue({ cityId: null });
              }
          });
        }
      });
    }
  }

  saveProjectChanges(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.projectId) {
      this.errorMessage = 'ID проекта не найден.';
      return;
    }

    if (this.projectEditForm.valid) {
      const updatedProject: UpdateProjectRequest = this.projectEditForm.value;
      if (typeof updatedProject.cityId === 'string') {
        updatedProject.cityId = +updatedProject.cityId;
      }

      this.projectService.updateProject(this.projectId, updatedProject).subscribe({
        next: (project: ProjectResponse) => {
          this.successMessage = 'Данные проекта успешно обновлены!';
          this.isEditingProject = false;
          this.project$ = of(project);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error updating project:', err);
          this.errorMessage = this.extractErrorMessage(err, 'Ошибка при обновлении проекта.');
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля проекта.';
      this.projectEditForm.markAllAsTouched();
    }
  }

  confirmDeleteProject(): void {
    this.confirmModalMessage = 'Вы уверены, что хотите безвозвратно удалить этот проект? Это действие нельзя отменить.';
    this.confirmAction = () => this.executeDeleteProject();
    this.showConfirmModal = true;
  }

  private executeDeleteProject(): void {
    if (!this.projectId) {
      this.errorMessage = 'ID проекта не найден для удаления.';
      return;
    }

    this.projectService.deleteProject(this.projectId).subscribe({
      next: () => {
        this.successMessage = 'Проект успешно удален.';
        this.closeConfirmModal();
        this.router.navigate(['/my-projects']);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error deleting project:', err);
        this.errorMessage = this.extractErrorMessage(err, 'Ошибка при удалении проекта.');
        this.closeConfirmModal();
      }
    });
  }

  inviteParticipant(): void {
    this.invitationErrorMessage = '';
    this.invitationSuccessMessage = '';

    if (!this.projectId) {
      this.invitationErrorMessage = 'ID проекта не найден.';
      return;
    }

    if (this.invitationForm.valid) {
      const request: CreateInvitationRequest = this.invitationForm.value;
      this.projectService.inviteParticipant(this.projectId, request).subscribe({
        next: (response: InvitationResponse) => {
          this.invitationSuccessMessage = `Приглашение для ${response.userFullName} (${response.role}) успешно отправлено!`;
          this.invitationForm.reset({
            role: '',
            canUploadDocuments: false,
            canSendNotifications: false
          });
          this.loadProjectData();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error inviting participant:', err);
          this.invitationErrorMessage = this.extractErrorMessage(err, 'Ошибка при отправке приглашения.');
        }
      });
    } else {
      this.invitationErrorMessage = 'Пожалуйста, заполните все поля приглашения правильно.';
      this.invitationForm.markAllAsTouched();
    }
  }

  confirmRemoveParticipant(participantId: number): void {
    this.confirmModalMessage = 'Вы уверены, что хотите удалить этого участника?';
    this.confirmAction = () => this.executeRemoveParticipant(participantId);
    this.showConfirmModal = true;
  }

  private executeRemoveParticipant(participantId: number): void {
    if (!this.projectId) {
      this.invitationErrorMessage = 'ID проекта не найден.';
      return;
    }

    this.participantService.removeParticipant(participantId).subscribe({
      next: () => {
        this.invitationSuccessMessage = 'Участник успешно удален.';
        this.loadProjectData();
        this.closeConfirmModal();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error removing participant:', err);
        this.invitationErrorMessage = this.extractErrorMessage(err, 'Ошибка при удалении участника.');
        this.closeConfirmModal();
      }
    });
  }


  editParticipant(participant: ParticipantResponse): void {
    this.currentParticipantToEdit = participant;
    this.editParticipantForm.patchValue({
      role: participant.role,
      canUploadDocuments: participant.canUploadDocuments,
      canSendNotifications: participant.canSendNotifications
    });
    this.editParticipantErrorMessage = '';
    this.editParticipantSuccessMessage = '';
    this.showEditParticipantModal = true;
  }

  closeEditParticipantModal(): void {
    this.showEditParticipantModal = false;
    this.currentParticipantToEdit = null;
    this.editParticipantForm.reset();
  }

  saveParticipantChanges(): void {
    this.editParticipantErrorMessage = '';
    this.editParticipantSuccessMessage = '';

    if (!this.currentParticipantToEdit || !this.currentParticipantToEdit.id) {
      this.editParticipantErrorMessage = 'Участник для редактирования не найден.';
      return;
    }

    if (this.editParticipantForm.valid) {
      const updatedParticipantData: UpdateParticipantRequest = this.editParticipantForm.value;

      this.participantService.updateParticipant(this.currentParticipantToEdit.id, updatedParticipantData).subscribe({
        next: () => {
          this.editParticipantSuccessMessage = 'Данные участника успешно обновлены!';
          this.loadProjectData();
          setTimeout(() => {
            this.closeEditParticipantModal();
          }, 1500);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error updating participant:', err);
          this.editParticipantErrorMessage = this.extractErrorMessage(err, 'Ошибка при обновлении данных участника.');
        }
      });
    } else {
      this.editParticipantErrorMessage = 'Пожалуйста, заполните все поля правильно.';
      this.editParticipantForm.markAllAsTouched();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadFileForm.patchValue({ file: file });
      this.uploadFileForm.get('file')?.updateValueAndValidity();
    } else {
      this.uploadFileForm.patchValue({ file: null });
    }
  }

  uploadProjectFile(): void {
    this.fileUploadErrorMessage = '';
    this.fileUploadSuccessMessage = '';

    if (!this.projectId) {
      this.fileUploadErrorMessage = 'ID проекта не найден.';
      return;
    }

    if (this.uploadFileForm.valid && this.uploadFileForm.get('file')?.value) {
      const file: File = this.uploadFileForm.get('file')?.value;
      this.projectService.uploadProjectFile(this.projectId, file).subscribe({
        next: () => {
          this.fileUploadSuccessMessage = `Файл "${file.name}" успешно загружен!`;
          this.uploadFileForm.reset();
          const fileInput = document.getElementById('projectFile') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
          this.loadProjectData();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error uploading file:', err);
          this.fileUploadErrorMessage = this.extractErrorMessage(err, 'Ошибка при загрузке файла.');
        }
      });
    } else {
      this.fileUploadErrorMessage = 'Пожалуйста, выберите файл для загрузки.';
    }
  }

  downloadFile(fileId: number, fileName: string): void {
    const fileDownloadUrl = `${environment.apiUrl}/files/download/${fileId}`;
    window.open(fileDownloadUrl, '_blank');
    this.successMessage = `Файл "${fileName}" открыт для скачивания.`;
  }

  confirmDeleteFile(fileId: number): void {
    this.confirmModalMessage = 'Вы уверены, что хотите удалить этот файл?';
    this.confirmAction = () => this.executeDeleteFile(fileId);
    this.showConfirmModal = true;
  }

  private executeDeleteFile(fileId: number): void {
    this.fileUploadErrorMessage = '';
    this.fileUploadSuccessMessage = '';

    this.projectService.deleteProjectFile(fileId).subscribe({
      next: () => {
        this.fileUploadSuccessMessage = 'Файл успешно удален.';
        this.loadProjectData();
        this.closeConfirmModal();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error deleting file:', err);
        this.fileUploadErrorMessage = this.extractErrorMessage(err, 'Ошибка при удалении файла.');
        this.closeConfirmModal();
      }
    });
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmModalMessage = '';
    this.confirmAction = null;
  }

  executeConfirmedAction(): void {
    if (this.confirmAction) {
      this.confirmAction();
    }
  }

  private extractErrorMessage(err: HttpErrorResponse, defaultMessage: string): string {
    if (err.error instanceof ProgressEvent) {
      return 'Не удалось подключиться к серверу. Пожалуйста, проверьте ваше интернет-соединение.';
    } else if (typeof err.error === 'string') {
      return err.error;
    } else if (err.error && typeof err.error === 'object' && err.error.message) {
      return err.error.message;
    } else if (err.error && typeof err.error === 'object' && err.error.error) {
      return err.error.error;
    } else if (err.status === 400) {
      if (err.error && err.error.errors && Array.isArray(err.error.errors)) {
        return err.error.errors.map((e: any) => e.defaultMessage || e.message).join('; ');
      }
      return err.error || 'Некорректные данные. Пожалуйста, проверьте введенную информацию.';
    } else if (err.status === 0) {
      return 'Не удалось связаться с сервером. Возможно, сервер недоступен или проблема с CORS.';
    }
    return defaultMessage;
  }
}


