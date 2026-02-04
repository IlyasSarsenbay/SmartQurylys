import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../core/user.service';
import { ProjectService } from '../core/project.service';
import { UserResponse } from '../core/models/user';
import { ProjectResponse } from '../core/models/project';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { UserProfileEditModalComponent } from './user-profile-edit-modal/user-profile-edit-modal.component';
import { OrganisationProfileEditModalComponent } from './organisation-profile-edit-modal/organisation-profile-edit-modal.component';
import { UserEmailEditModalComponent } from './user-email-edit-modal/user-email-edit-modal.component';
import { UserPasswordEditModalComponent } from './user-password-edit-modal/user-password-edit-modal.component';
import { OrganisationService } from '../core/organisation.service';
import { OrganisationResponse } from '../core/models/organisation';
import { LicenseResponse } from '../core/models/license';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-personal-cabinet',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    UserProfileEditModalComponent,
    OrganisationProfileEditModalComponent,
    UserEmailEditModalComponent,
    UserPasswordEditModalComponent,
    FormsModule
  ],
  templateUrl: './personal-cabinet.component.html',
  styleUrls: ['./personal-cabinet.component.css']
})
export class PersonalCabinetComponent implements OnInit {
  user: UserResponse | null = null;
  organisationToEdit: OrganisationResponse | null = null; // New property
  projects: ProjectResponse[] = [];
  loadingUser: boolean = true;
  loadingProjects: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  showEditProfileModal: boolean = false;
  showEditOrganisationProfileModal: boolean = false;
  showEditEmailModal: boolean = false;
  showEditPasswordModal: boolean = false;

  // License management
  licenses: LicenseResponse[] = [];
  loadingLicenses: boolean = false;
  selectedLicenseFile: File | null = null;
  newLicenseCategory: string = '';
  isUploadingLicense: boolean = false;

  // Editing existing license
  editingLicenseId: number | null = null;
  editLicenseName: string = '';
  editLicenseCategory: string = '';
  editLicenseFile: File | null = null;
  isUpdatingStatus: boolean = false;

  get isOrganisationUser(): boolean {
    return this.user?.userType === 'ORGANISATION';
  }

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private router: Router,
    private organisationService: OrganisationService // Injected
  ) { }

  ngOnInit(): void {
    this.loadUserDataAndProjects();
  }

  loadUserDataAndProjects(): void {
    this.loadingUser = true;
    this.loadingProjects = true;
    this.errorMessage = '';

    forkJoin({
      user: this.userService.getCurrentUser().pipe(
        catchError(error => {
          this.errorMessage = 'Ошибка загрузки данных пользователя.';
          console.error('Error loading user info:', error);
          return of(null);
        })
      ),
      projects: this.projectService.getMyProjects().pipe(
        catchError(error => {
          this.errorMessage = 'Ошибка загрузки проектов.';
          console.error('Error loading projects:', error);
          return of([]);
        })
      )
    }).subscribe({
      next: (results) => {
        this.user = results.user;
        this.projects = results.projects.map(project => {
          const endDate = new Date(project.endDate);
          const now = new Date();
          const diffMs = endDate.getTime() - now.getTime();

          let timeRemainingInfo: { days?: number; hours?: number; isExpired: boolean; expiredDate?: string; };

          if (diffMs <= 0) {
            timeRemainingInfo = {
              isExpired: true,
              expiredDate: new Date(project.endDate).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
            };
          } else {
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeRemainingInfo = {
              days: diffDays,
              hours: diffHours,
              isExpired: false
            };
          }

          return {
            ...project,
            timeRemaining: timeRemainingInfo
          };
        });
        this.loadingUser = false;
        this.loadingProjects = false;

        if (this.isOrganisationUser) {
          this.loadLicenses();
        }
      },
      error: (err) => {
        console.error('An unexpected error occurred during forkJoin:', err);
        this.errorMessage = 'Произошла непредвиденная ошибка при загрузке данных.';
        this.loadingUser = false;
        this.loadingProjects = false;
      }
    });
  }

  loadLicenses(): void {
    this.loadingLicenses = true;
    this.organisationService.getMyOrganisationLicenses().subscribe({
      next: (licenses) => {
        this.licenses = licenses;
        this.loadingLicenses = false;
      },
      error: (error) => {
        console.error('Error loading licenses:', error);
        this.loadingLicenses = false;
      }
    });
  }

  onLicenseFileSelected(event: any): void {
    this.selectedLicenseFile = event.target.files[0];
  }

  addLicense(): void {
    if (!this.selectedLicenseFile) return;

    this.isUploadingLicense = true;
    this.organisationService.addLicenseToMyOrganisation(this.selectedLicenseFile, this.newLicenseCategory).subscribe({
      next: (newLicense) => {
        this.licenses.unshift(newLicense);
        this.selectedLicenseFile = null;
        this.newLicenseCategory = '';
        this.isUploadingLicense = false;

        const fileInput = document.getElementById('newLicenseFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (error) => {
        console.error('Error adding license:', error);
        this.isUploadingLicense = false;
        this.errorMessage = 'Ошибка при добавлении лицензии: ' + (error.error?.message || error.statusText);
      }
    });
  }

  startEditingLicense(license: LicenseResponse): void {
    this.editingLicenseId = license.id;
    this.editLicenseName = license.name;
    this.editLicenseCategory = license.licenseCategoryDisplay || '';
    this.editLicenseFile = null;
  }

  onEditLicenseFileSelected(event: any): void {
    this.editLicenseFile = event.target.files[0];
  }

  cancelEditingLicense(): void {
    this.editingLicenseId = null;
    this.editLicenseName = '';
    this.editLicenseCategory = '';
    this.editLicenseFile = null;
  }

  updateLicense(): void {
    if (this.editingLicenseId === null) return;

    this.isUploadingLicense = true;
    this.organisationService.updateMyLicense(
      this.editingLicenseId,
      this.editLicenseFile || undefined,
      this.editLicenseName,
      this.editLicenseCategory
    ).subscribe({
      next: (updatedLicense) => {
        const index = this.licenses.findIndex(l => l.id === this.editingLicenseId);
        if (index !== -1) {
          this.licenses[index] = updatedLicense;
        }
        this.cancelEditingLicense();
        this.isUploadingLicense = false;
        this.successMessage = 'Лицензия успешно обновлена!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating license:', error);
        this.isUploadingLicense = false;
        this.errorMessage = 'Ошибка при обновлении лицензии: ' + (error.error?.message || error.statusText);
      }
    });
  }

  downloadLicense(license: LicenseResponse): void {
    this.organisationService.downloadFile(license.id).subscribe({
      next: (response) => {
        const blob = response.body;
        const contentDisposition = response.headers.get('content-disposition');
        let filename = license.name;

        if (contentDisposition) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const url = window.URL.createObjectURL(blob!);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Ошибка при скачивании лицензии:', error);
        this.errorMessage = 'Ошибка при скачивании лицензии: ' + (error.message || 'Неизвестная ошибка');
      }
    });
  }

  toggleAvailability(): void {
    if (!this.user || !this.isOrganisationUser) return;

    this.isUpdatingStatus = true;
    this.organisationService.getMyOrganisationInfo().subscribe({
      next: (org) => {
        const newStatus = org.status === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
        this.organisationService.updateMyOrganisation({ status: newStatus as any }).subscribe({
          next: (updatedOrg) => {
            this.isUpdatingStatus = false;
            this.successMessage = `Статус изменен на: ${updatedOrg.status === 'AVAILABLE' ? 'Свободен' : 'Занят'}`;
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error) => {
            this.isUpdatingStatus = false;
            this.errorMessage = 'Ошибка при обновлении статуса.';
            console.error('Error updating status:', error);
          }
        });
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        console.error('Error fetching org info for toggle:', err);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-pending';
    }
  }

  getStatusText(status: string): string {
    const statuses: any = {
      'APPROVED': 'Одобрена',
      'REJECTED': 'Отклонена',
      'PENDING_REVIEW': 'На проверке'
    };
    return statuses[status] || status;
  }

  openProject(projectId: number): void {
    this.router.navigate(['/projects', projectId]);
  }

  addNewProject(): void {
    this.router.navigate(['/create-project']);
  }

  openEditModal(): void {
    if (this.isOrganisationUser) {
      this.organisationService.getMyOrganisationInfo().subscribe({
        next: (organisation) => {
          this.organisationToEdit = organisation;
          this.openEditOrganisationProfileModal(organisation);
        },
        error: (error) => {
          console.error('Error loading full organisation data:', error);
          this.errorMessage = 'Ошибка загрузки данных организации.';
        }
      });
    } else {
      this.openEditProfileModal();
    }
  }

  openEditProfileModal(): void {
    this.showEditProfileModal = true;
  }

  closeEditProfileModal(): void {
    this.showEditProfileModal = false;
  }

  onUserUpdated(updatedUser: UserResponse): void {
    this.user = updatedUser;
    this.closeEditProfileModal();
    this.loadUserDataAndProjects();
  }

  openEditOrganisationProfileModal(organisation: OrganisationResponse): void {
    this.organisationToEdit = organisation; // Set for the input binding
    this.showEditOrganisationProfileModal = true;
  }

  closeEditOrganisationProfileModal(): void {
    this.showEditOrganisationProfileModal = false;
    this.organisationToEdit = null; // Clear data when modal closes
  }

  onOrganisationUpdated(updatedUser: UserResponse): void {
    this.user = updatedUser; // Still update base user data
    this.closeEditOrganisationProfileModal();
    this.loadUserDataAndProjects();
  }

  openEditEmailModal(): void {
    this.showEditEmailModal = true;
  }

  closeEditEmailModal(): void {
    this.showEditEmailModal = false;
  }

  onEmailUpdated(newEmail: string): void {
    if (this.user) {
      this.user.email = newEmail;
    }
    this.closeEditEmailModal();
    this.loadUserDataAndProjects();
  }

  openEditPasswordModal(): void {
    this.showEditPasswordModal = true;
  }

  closeEditPasswordModal(): void {
    this.showEditPasswordModal = false;
  }

  onPasswordUpdated(): void {
    this.closeEditPasswordModal();
    this.loadUserDataAndProjects();
  }
}

