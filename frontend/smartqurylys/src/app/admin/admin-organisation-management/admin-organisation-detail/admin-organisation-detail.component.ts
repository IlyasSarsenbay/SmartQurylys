import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormControl, AbstractControl, FormsModule } from '@angular/forms';
import { OrganisationService } from '../../../core/organisation.service';
import { OrganisationUpdateRequest, LicenseUpdateRequest } from '../../../core/models/organisation';
import { OrganisationResponse } from '../../../core/models/organisation';
import { LicenseResponse } from '../../../core/models/license';
import { CityService } from '../../../core/city.service';
import { City } from '../../../core/models/city';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrganisationType } from '../../../core/enums/organisation-type.enum';
import { Specialization } from '../../../core/enums/specialisation.enum';
import { FileReviewStatus } from '../../../core/enums/file-review-status.enum';

@Component({
  selector: 'app-admin-organisation-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-organisation-detail.component.html',
  styleUrls: ['./admin-organisation-detail.component.css']
})
export class AdminOrganisationDetailComponent implements OnInit {
  organisationId: number | null = null;
  organisationForm!: FormGroup;
  cities: City[] = [];
  successMessage: string = '';
  errorMessage: string = '';

  licenses: LicenseResponse[] = [];
  FileReviewStatus = FileReviewStatus;
  rejectionReason: string = ''; // Причина отклонения лицензии

  // Для загрузки новой лицензии
  selectedFile: File | null = null;
  licenseCategory: string = '';
  isUploading: boolean = false;

  public fileReviewStatusOptions = Object.keys(FileReviewStatus).map(key => ({
    key,
    value: FileReviewStatus[key as keyof typeof FileReviewStatus]
  }));

  public organisationTypeOptions = Object.keys(OrganisationType).map(key => ({
    key,
    value: OrganisationType[key as keyof typeof OrganisationType]
  }));
  public specializationOptions = Object.keys(Specialization).map(key => ({
    key,
    value: Specialization[key as keyof typeof Specialization]
  }));
  public specializationKeys: string[] = Object.keys(Specialization);

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private organisationService: OrganisationService,
    private cityService: CityService
  ) {
    this.organisationForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      iinBin: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      cityId: [null, Validators.required],
      judAddress: [''],
      organization: ['', Validators.required],
      position: [''],
      type: [null, Validators.required],
      field: [''],
      yearsOfExperience: [null, [Validators.required, Validators.min(0)]],
    });

    const specializationFormGroup = new FormGroup({});
    this.specializationKeys.forEach(specKey => {
      specializationFormGroup.addControl(specKey, new FormControl(false));
    });
    this.organisationForm.addControl('specialization', specializationFormGroup);

    this.organisationForm.get('specialization')?.setValidators(
      (control: AbstractControl) => {
        const specializationGroup = control as FormGroup;
        const hasSelection = Object.values(specializationGroup.value).some(value => value);
        return hasSelection ? null : { required: true };
      }
    );
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.organisationId = Number(params.get('id'));
      if (this.organisationId) {
        forkJoin({
          organisation: this.organisationService.getOrganisationById(this.organisationId),
          cities: this.cityService.getAllCities(),
          licenses: this.organisationService.getOrganisationLicensesAdmin(this.organisationId)
        }).subscribe({
          next: ({ organisation, cities, licenses }) => {
            console.log('Fetched Organisation Data:', organisation);
            console.log('Fetched Cities Data:', cities);
            console.log('Fetched Licenses Data:', licenses);
            this.cities = cities;
            this.licenses = licenses;
            const organizationCity = this.cities.find(city => city.name === organisation.city);
            this.organisationForm.patchValue({
              fullName: organisation.fullName ?? '',
              email: organisation.email ?? '',
              phone: organisation.phone ?? '',
              iinBin: organisation.iinBin ?? '',
              cityId: organizationCity ? organizationCity.id : null,
              judAddress: organisation.judAddress ?? '',
              organization: organisation.organization ?? '',
              position: organisation.position ?? '',
              type: organisation.type ?? null,
              field: organisation.field ?? '',
              yearsOfExperience: organisation.yearsOfExperience ?? 0,
            });
            organisation.specialization.forEach(spec => {
              if (this.organisationForm.get('specialization')?.get(spec)) {
                this.organisationForm.get('specialization')?.get(spec)?.setValue(true);
              }
            });
            // Enable the form except email
            this.organisationForm.enable();
            this.organisationForm.get('email')?.disable();
          },
          error: (error) => {
            this.errorMessage = 'Ошибка загрузки данных организации: ' + (error.message || error.statusText);
            console.error('Error loading organisation data:', error);
          }
        });
      }
    });
  }

  // initializeForm is no longer needed as we initialize in constructor and patchValue in subscribe
  // initializeForm(organisation: OrganisationResponse): void {
  //   this.organisationForm = this.fb.group({
  //     fullName: [organisation.fullName ?? '', Validators.required],
  //     email: [organisation.email ?? '', [Validators.required, Validators.email]],
  //     phone: [organisation.phone ?? ''],
  //     iinBin: [organisation.iinBin ?? '', [Validators.required, Validators.pattern(/^\d{12}$/)]],
  //     city: [organisation.city ?? ''],
  //     judAddress: [organisation.judAddress ?? ''],
  //     organization: [organisation.organization ?? '', Validators.required],
  //     position: [organisation.position ?? ''],
  //     type: [organisation.type ?? ''],
  //     field: [organisation.field ?? ''],
  //     specialization: [organisation.specialization ? organisation.specialization.join(', ') : ''],
  //     yearsOfExperience: [organisation.yearsOfExperience ?? 0],
  //   });
  // }

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.organisationForm.valid && this.organisationId) {
      const formValue = this.organisationForm.value;

      const selectedSpecializations = this.specializationKeys
        .filter(key => formValue.specialization[key]);

      const request: OrganisationUpdateRequest = {
        fullName: formValue.fullName,
        email: formValue.email,
        phone: formValue.phone,
        iinBin: formValue.iinBin,
        cityId: formValue.cityId,
        judAddress: formValue.judAddress,
        organization: formValue.organization,
        position: formValue.position,
        type: formValue.type,
        field: formValue.field,
        specialization: selectedSpecializations,
        yearsOfExperience: formValue.yearsOfExperience,
      };

      this.organisationService.updateOrganisation(this.organisationId, request).subscribe({
        next: (updatedOrganisation) => {
          this.successMessage = 'Данные организации успешно обновлены!';
          console.log('Organisation updated:', updatedOrganisation);
          const updatedOrganisationCity = this.cities.find(city => city.name === updatedOrganisation.city);
          this.organisationForm.patchValue({
            fullName: updatedOrganisation.fullName ?? '',
            email: updatedOrganisation.email ?? '',
            phone: updatedOrganisation.phone ?? '',
            iinBin: updatedOrganisation.iinBin ?? '',
            cityId: updatedOrganisationCity ? updatedOrganisationCity.id : null,
            judAddress: updatedOrganisation.judAddress ?? '',
            organization: updatedOrganisation.organization ?? '',
            position: updatedOrganisation.position ?? '',
            type: updatedOrganisation.type ?? null,
            field: updatedOrganisation.field ?? '',
            yearsOfExperience: updatedOrganisation.yearsOfExperience ?? 0,
          });
          // Reset specialization checkboxes after update
          this.specializationKeys.forEach(spec => {
            this.organisationForm.get('specialization')?.get(spec)?.setValue(updatedOrganisation.specialization.includes(spec));
          });
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = 'Ошибка при обновлении организации: ' + (error.error?.message || error.statusText || error.message);
          console.error('Error updating organisation:', error);
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  updateLicenseStatus(licenseId: number, status: string): void {
    this.successMessage = '';
    this.errorMessage = '';

    const request: LicenseUpdateRequest = {
      reviewStatus: status,
      ...(status === 'REJECTED' && this.rejectionReason ? { rejectionReason: this.rejectionReason } : {})
    };

    this.organisationService.updateLicense(licenseId, request).subscribe({
      next: (updatedLicense) => {
        this.successMessage = `Лицензия успешно ${status === 'APPROVED' ? 'одобрена' : 'отклонена'}!`;
        console.log('License updated:', updatedLicense);

        // Обновляем лицензию в списке
        const index = this.licenses.findIndex(l => l.id === licenseId);
        if (index !== -1) {
          this.licenses[index] = updatedLicense;
        }

        // Сбрасываем причину отклонения
        this.rejectionReason = '';

        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = 'Ошибка при обновлении статуса лицензии: ' + (error.error?.message || error.statusText || error.message);
        console.error('Error updating license:', error);
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  approveLicense(licenseId: number): void {
    this.updateLicenseStatus(licenseId, 'APPROVED');
  }

  rejectLicense(licenseId: number): void {
    const reason = prompt('Укажите причину отклонения лицензии:');
    if (reason !== null) { // null означает, что пользователь нажал "Отмена"
      this.rejectionReason = reason.trim();
      this.updateLicenseStatus(licenseId, 'REJECTED');
    }
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

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadLicense(): void {
    if (!this.selectedFile || !this.organisationId) return;

    this.isUploading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.organisationService.addLicenseToOrganisation(this.organisationId, this.selectedFile, this.licenseCategory).subscribe({
      next: (newLicense) => {
        this.licenses.unshift(newLicense); // Добавляем новую лицензию в начало списка
        this.isUploading = false;
        this.selectedFile = null;
        this.licenseCategory = '';
        this.successMessage = 'Лицензия успешно загружена!';

        // Сбрасываем input file
        const fileInput = document.getElementById('licenseFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isUploading = false;
        this.errorMessage = 'Ошибка при загрузке лицензии: ' + (error.error?.message || error.statusText || error.message);
        console.error('Error uploading license:', error);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      case 'PENDING_REVIEW':
      default:
        return 'status-pending';
    }
  }

  getStatusText(status: string): string {
    return FileReviewStatus[status as keyof typeof FileReviewStatus] || status;
  }
}