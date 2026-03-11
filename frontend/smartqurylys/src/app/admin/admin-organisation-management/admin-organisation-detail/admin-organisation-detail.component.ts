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
import { RepresentativeDocumentResponse } from '../../../core/models/representative-document';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrganisationType } from '../../../core/enums/organisation-type.enum';
import { Specialization } from '../../../core/enums/specialisation.enum';
import { FileReviewStatus } from '../../../core/enums/file-review-status.enum';

/**
 * Компонент для просмотра и редактирования детальной информации организации
 * @description Позволяет администратору:
 * - Просматривать и редактировать данные организации
 * - Управлять лицензиями (одобрение/отклонение/загрузка)
 * - Управлять документами представителя
 * - Обновлять специализации и другую информацию
 */
@Component({
  selector: 'app-admin-organisation-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-organisation-detail.component.html',
  styleUrls: ['./admin-organisation-detail.component.css']
})
export class AdminOrganisationDetailComponent implements OnInit {
  /** ID текущей организации из URL */
  organisationId: number | null = null;
  
  /** Реактивная форма для редактирования данных организации */
  organisationForm!: FormGroup;
  
  /** Список доступных городов для выпадающего списка */
  cities: City[] = [];
  
  /** Сообщение об успешном выполнении операции */
  successMessage: string = '';
  
  /** Сообщение об ошибке */
  errorMessage: string = '';
  
  /** Список лицензий организации */
  licenses: LicenseResponse[] = [];
  
  /** Enum для проверки статусов в шаблоне */
  FileReviewStatus = FileReviewStatus;
  
  /** Причина отклонения лицензии (для модального окна) */
  rejectionReason: string = '';
  
  /** Документы представителя организации */
  representativeDocuments: RepresentativeDocumentResponse[] = [];
  
  /** Флаг загрузки документов представителя */
  loadingRepDocs: boolean = false;
  
  /** Выбранный файл для загрузки новой лицензии */
  selectedFile: File | null = null;
  
  /** Категория загружаемой лицензии */
  licenseCategory: string = '';
  
  /** Флаг процесса загрузки */
  isUploading: boolean = false;

  /** Опции для выпадающего списка статусов (из enum) */
  public fileReviewStatusOptions = Object.keys(FileReviewStatus).map(key => ({
    key,
    value: FileReviewStatus[key as keyof typeof FileReviewStatus]
  }));

  /** Опции типов организаций */
  public organisationTypeOptions = Object.keys(OrganisationType).map(key => ({
    key,
    value: OrganisationType[key as keyof typeof OrganisationType]
  }));
  
  /** Опции специализаций */
  public specializationOptions = Object.keys(Specialization).map(key => ({
    key,
    value: Specialization[key as keyof typeof Specialization]
  }));
  
  /** Ключи специализаций для динамического создания формы */
  public specializationKeys: string[] = Object.keys(Specialization);

  constructor(
    private route: ActivatedRoute,      // Для получения параметров из URL
    private fb: FormBuilder,            // Для создания реактивной формы
    private organisationService: OrganisationService,  // Сервис для работы с организациями
    private cityService: CityService    // Сервис для получения списка городов
  ) {
    this.initForm();
  }

  /**
   * Инициализация реактивной формы
   * @private
   */
  private initForm(): void {
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

    // Динамическое создание группы для чекбоксов специализаций
    const specializationFormGroup = new FormGroup({});
    this.specializationKeys.forEach(specKey => {
      specializationFormGroup.addControl(specKey, new FormControl(false));
    });
    this.organisationForm.addControl('specialization', specializationFormGroup);

    // Валидатор - хотя бы одна специализация должна быть выбрана
    this.organisationForm.get('specialization')?.setValidators(
      (control: AbstractControl) => {
        const specializationGroup = control as FormGroup;
        const hasSelection = Object.values(specializationGroup.value).some(value => value);
        return hasSelection ? null : { required: true };
      }
    );
  }

  /**
   * Загрузка данных при инициализации компонента
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.organisationId = Number(params.get('id'));
      if (this.organisationId) {
        this.loadOrganisationData();
      }
    });
  }

  /**
   * Загрузка всех данных организации (сама организация, города, лицензии, документы)
   * @private
   */
  private loadOrganisationData(): void {
    forkJoin({
      organisation: this.organisationService.getOrganisationById(this.organisationId!),
      cities: this.cityService.getAllCities(),
      licenses: this.organisationService.getOrganisationLicensesAdmin(this.organisationId!),
      repDocs: this.organisationService.getRepresentativeDocumentsAdmin(this.organisationId!)
    }).subscribe({
      next: ({ organisation, cities, licenses, repDocs }) => {
        console.log('Fetched Organisation Data:', organisation);
        console.log('Fetched Cities Data:', cities);
        console.log('Fetched Licenses Data:', licenses);
        console.log('Fetched RepDocs Data:', repDocs);
        
        this.cities = cities;
        this.licenses = licenses;
        this.representativeDocuments = repDocs;
        
        this.patchFormWithOrganisationData(organisation);
        
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

  /**
   * Заполнение формы данными организации
   * @param organisation - данные организации из API
   * @private
   */
  private patchFormWithOrganisationData(organisation: OrganisationResponse): void {
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

    // Отмечаем специализации
    organisation.specialization.forEach(spec => {
      if (this.organisationForm.get('specialization')?.get(spec)) {
        this.organisationForm.get('specialization')?.get(spec)?.setValue(true);
      }
    });
  }

  /**
   * Обработчик отправки формы обновления организации
   */
  onSubmit(): void {
    this.clearMessages();
    
    if (this.organisationForm.valid && this.organisationId) {
      const request = this.buildUpdateRequest();
      
      this.organisationService.updateOrganisation(this.organisationId, request).subscribe({
        next: (updatedOrganisation) => {
          this.successMessage = 'Данные организации успешно обновлены!';
          console.log('Organisation updated:', updatedOrganisation);
          
          this.patchFormWithOrganisationData(updatedOrganisation);
          
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.handleError('обновлении организации', error);
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  /**
   * Формирование запроса на обновление из данных формы
   * @private
   */
  private buildUpdateRequest(): OrganisationUpdateRequest {
    const formValue = this.organisationForm.value;
    const selectedSpecializations = this.specializationKeys
      .filter(key => formValue.specialization[key]);

    return {
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
  }

  /**
   * Обновление статуса лицензии
   * @param licenseId - ID лицензии
   * @param status - новый статус
   */
  updateLicenseStatus(licenseId: number, status: string): void {
    this.clearMessages();

    const request: LicenseUpdateRequest = {
      reviewStatus: status,
      ...(status === 'REJECTED' && this.rejectionReason ? { rejectionReason: this.rejectionReason } : {})
    };

    this.organisationService.updateLicense(licenseId, request).subscribe({
      next: (updatedLicense) => {
        const statusText = status === 'APPROVED' ? 'одобрена' : 'отклонена';
        this.successMessage = `Лицензия успешно ${statusText}!`;
        console.log('License updated:', updatedLicense);

        // Обновляем лицензию в списке
        const index = this.licenses.findIndex(l => l.id === licenseId);
        if (index !== -1) {
          this.licenses[index] = updatedLicense;
        }

        this.rejectionReason = '';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.handleError('обновлении статуса лицензии', error);
      }
    });
  }

  /**
   * Одобрение лицензии
   * @param licenseId - ID лицензии
   */
  approveLicense(licenseId: number): void {
    this.updateLicenseStatus(licenseId, 'APPROVED');
  }

  /**
   * Отклонение лицензии с указанием причины
   * @param licenseId - ID лицензии
   */
  rejectLicense(licenseId: number): void {
    const reason = prompt('Укажите причину отклонения лицензии:');
    if (reason !== null) {
      this.rejectionReason = reason.trim();
      this.updateLicenseStatus(licenseId, 'REJECTED');
    }
  }

  /**
   * Скачивание файла лицензии
   * @param license - объект лицензии
   */
  downloadLicense(license: LicenseResponse): void {
    this.downloadFile(license.id, license.name);
  }

  /**
   * Обработчик выбора файла для загрузки
   * @param event - событие выбора файла
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  /**
   * Загрузка новой лицензии
   */
  uploadLicense(): void {
    if (!this.selectedFile || !this.organisationId) return;

    this.isUploading = true;
    this.clearMessages();

    this.organisationService.addLicenseToOrganisation(this.organisationId, this.selectedFile, this.licenseCategory).subscribe({
      next: (newLicense) => {
        this.licenses.unshift(newLicense); // Добавляем в начало списка
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
        this.handleError('загрузке лицензии', error);
      }
    });
  }

  /**
   * Получение CSS класса для бейджа статуса
   * @param status - статус
   */
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

  /**
   * Получение текстового представления статуса
   * @param status - статус
   */
  getStatusText(status: string): string {
    return FileReviewStatus[status as keyof typeof FileReviewStatus] || status;
  }

  /**
   * Обновление статуса документа представителя
   * @param docId - ID документа
   * @param status - новый статус
   */
  updateRepDocStatus(docId: number, status: string): void {
    this.clearMessages();

    const request: LicenseUpdateRequest = {
      reviewStatus: status,
      rejectionReason: this.rejectionReason
    };

    this.organisationService.updateRepresentativeDocumentStatus(docId, request).subscribe({
      next: (updatedDoc) => {
        const statusText = status === 'APPROVED' ? 'одобрен' : 'отклонен';
        this.successMessage = `Документ представителя успешно ${statusText}!`;
        
        const index = this.representativeDocuments.findIndex(d => d.id === docId);
        if (index !== -1) {
          this.representativeDocuments[index] = updatedDoc;
        }
        
        this.rejectionReason = '';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.handleError('обновлении статуса документа', error);
      }
    });
  }

  /**
   * Одобрение документа представителя
   * @param docId - ID документа
   */
  approveRepDoc(docId: number): void {
    this.updateRepDocStatus(docId, 'APPROVED');
  }

  /**
   * Отклонение документа представителя
   * @param docId - ID документа
   */
  rejectRepDoc(docId: number): void {
    const reason = prompt('Укажите причину отклонения документа представителя:');
    if (reason !== null) {
      this.rejectionReason = reason.trim();
      this.updateRepDocStatus(docId, 'REJECTED');
    }
  }

  /**
   * Скачивание документа представителя
   * @param doc - объект документа
   */
  downloadRepDoc(doc: RepresentativeDocumentResponse): void {
    this.downloadFile(doc.id, doc.name);
  }

  /**
   * Универсальный метод для скачивания файлов
   * @param fileId - ID файла
   * @param fileName - имя файла
   * @private
   */
  private downloadFile(fileId: number, fileName: string): void {
    this.organisationService.downloadFile(fileId).subscribe({
      next: (response) => {
        const blob = response.body;
        let filename = fileName;

        // Пытаемся получить имя файла из заголовка Content-Disposition
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        // Создаем ссылку и инициируем скачивание
        const url = window.URL.createObjectURL(blob!);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        
        // Очищаем
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Ошибка при скачивании файла:', error);
        this.errorMessage = 'Ошибка при скачивании файла: ' + (error.message || 'Неизвестная ошибка');
      }
    });
  }

  /**
   * Очистка сообщений об успехе и ошибке
   * @private
   */
  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Обработка ошибок с единообразным сообщением
   * @param action - действие, при котором произошла ошибка
   * @param error - объект ошибки
   * @private
   */
  private handleError(action: string, error: any): void {
    this.errorMessage = `Ошибка при ${action}: ` + 
      (error.error?.message || error.statusText || error.message);
    console.error(`Error during ${action}:`, error);
    setTimeout(() => this.errorMessage = '', 5000);
  }
}