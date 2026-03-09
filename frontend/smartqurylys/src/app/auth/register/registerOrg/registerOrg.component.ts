import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { OrganisationRegisterRequest } from '../../../core/models/auth';
import { CityService } from '../../../core/city.service';
import { City } from '../../../core/models/city';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { EmailVerificationService } from '../../../core/email-verification.service';
import { OrganisationType } from '../../../core/enums/organisation-type.enum';
import { Specialization } from '../../../core/enums/specialisation.enum';
import { CommonModule } from '@angular/common';

/**
 * Компонент для регистрации юридического лица
 * @description Двухэтапная регистрация:
 * 1. Верификация email через код подтверждения
 * 2. Заполнение данных организации и загрузка документов
 */
@Component({
  selector: 'app-registerOrg',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './registerOrg.component.html',
  styleUrls: ['./registerOrg.component.css']
})
export class RegisterOrgComponent implements OnInit {
  /** Форма регистрации организации */
  organisationForm: FormGroup;
  
  /** Список городов для выпадающего списка */
  cities$: Observable<City[]>;

  /** Сообщение об ошибке */
  errorMessage: string = '';

  /** Сообщение об успехе */
  successMessage: string = '';

  /** Флаг: код отправлен на email */
  emailSent: boolean = false;
  
  /** Флаг: email подтвержден */
  emailVerified: boolean = false;
  
  /** Флаг: идет загрузка файлов */
  isUploading: boolean = false;

  /** Выбранный файл документов представителя */
  representativeDocumentsFile: File | null = null;
  
  /** Выбранный файл лицензии */
  licenseFile: File | null = null;

  /** Опции типов организаций для выпадающего списка */
  public organisationTypeOptions = Object.keys(OrganisationType).map(key => ({
    key,
    value: OrganisationType[key as keyof typeof OrganisationType]
  }));

  /** Опции специализаций для чекбоксов */
  public specializationOptions = Object.keys(Specialization).map(key => ({
    key,
    value: Specialization[key as keyof typeof Specialization]
  }));

  /** Ключи типов организаций */
  public organisationTypeKeys: string[] = Object.keys(OrganisationType);
  
  /** Ключи специализаций */
  public specializationKeys: string[] = Object.keys(Specialization);

  /**
   * Конструктор компонента
   * @param fb - для создания реактивной формы
   * @param authService - сервис аутентификации
   * @param cityService - сервис для получения городов
   * @param emailVerificationService - сервис для верификации email
   * @param router - для навигации
   */
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cityService: CityService,
    private emailVerificationService: EmailVerificationService,
    private router: Router
  ) {
    // Инициализация основной формы
    this.organisationForm = this.fb.group({
      organization: ['', Validators.required],
      iinBin: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      judAddress: ['', Validators.required],
      fullName: ['', Validators.required],
      position: ['', Validators.required],
      type: [null, Validators.required],
      field: ['', Validators.required],
      yearsOfExperience: [null, [Validators.required, Validators.min(0)]],
      cityId: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
      verificationCode: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    // Динамическое создание группы чекбоксов для специализаций
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

    // По умолчанию поле кода отключено (до отправки email)
    this.organisationForm.get('verificationCode')?.disable();

    // Загрузка списка городов
    this.cities$ = this.cityService.getAllCities().pipe(
      catchError(error => {
        console.error('Error loading cities:', error);
        this.errorMessage = 'Не удалось загрузить список городов.';
        return of([]);
      })
    );
  }

  ngOnInit(): void { }

  /**
   * Обработчик выбора файла документов представителя
   * @param event - событие выбора файла
   */
  onRepresentativeDocumentsSelected(event: any): void {
    const file = event.target.files[0];
    this.representativeDocumentsFile = file;
  }

  /**
   * Обработчик выбора файла лицензии
   * @param event - событие выбора файла
   */
  onLicenseSelected(event: any): void {
    const file = event.target.files[0];
    this.licenseFile = file;
  }

  /**
   * Отправка кода подтверждения на email
   */
  sendVerificationCode(): void {
    this.clearMessages();
    const emailControl = this.organisationForm.get('email');
    
    if (emailControl?.valid) {
      this.emailVerificationService.sendEmailVerificationCode({ email: emailControl.value }).subscribe({
        next: (response: string) => {
          this.successMessage = response || 'Код подтверждения отправлен на вашу почту.';
          this.emailSent = true;
          this.organisationForm.get('verificationCode')?.enable();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = this.extractErrorMessage(err, 'Ошибка при отправке кода.');
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, введите корректный email для отправки кода.';
      emailControl?.markAsTouched();
    }
  }

  /**
   * Проверка введенного кода подтверждения
   */
  verifyCode(): void {
    this.clearMessages();
    const emailControl = this.organisationForm.get('email');
    const codeControl = this.organisationForm.get('verificationCode');
    
    if (emailControl?.valid && codeControl?.valid) {
      this.emailVerificationService.verifyEmailVerificationCode({ 
        email: emailControl.value, 
        code: codeControl.value 
      }).subscribe({
        next: (response: string) => {
          if (response === 'Почта успешно подтверждена' || response === '') {
            this.successMessage = response;
            this.handleEmailVerificationSuccess();
          } else {
            this.errorMessage = 'Ошибка при проверке кода: ' + response;
            this.emailVerified = false;
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = this.extractErrorMessage(err, 'Ошибка при проверке кода.');
          this.emailVerified = false;
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, введите email и код подтверждения.';
    }
  }

  /**
   * Обработка успешной верификации email
   * @private
   */
  private handleEmailVerificationSuccess(): void {
    this.emailVerified = true;
    this.organisationForm.get('email')?.disable();
    this.organisationForm.get('verificationCode')?.disable();
  }

  /**
   * Обработчик отправки формы регистрации
   */
  onSubmit(): void {
    this.clearMessages();

    if (!this.emailVerified) {
      this.errorMessage = 'Пожалуйста, сначала подтвердите ваш email.';
      return;
    }

    // Временно включаем email для отправки данных
    this.organisationForm.get('email')?.enable();
    
    const selectedSpecializations = this.getSelectedSpecializations();

    if (this.organisationForm.valid && selectedSpecializations.length > 0) {
      const request = this.buildRegisterRequest(selectedSpecializations);
      
      this.authService.registerOrganisation(request).subscribe({
        next: (response) => {
          this.successMessage = 'Регистрация организации прошла успешно! Загружаем документы...';
          console.log('Organisation registration successful:', response);
          this.uploadFiles();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Organisation registration failed:', err);
          this.errorMessage = this.extractErrorMessage(err, 'Ошибка регистрации организации. Пожалуйста, попробуйте еще раз.');
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните форму правильно и выберите хотя бы одну специализацию.';
      this.organisationForm.markAllAsTouched();
    }

    // Снова отключаем email после отправки
    if (this.emailVerified) {
      this.organisationForm.get('email')?.disable();
      this.organisationForm.get('verificationCode')?.disable();
    }
  }

  /**
   * Получение списка выбранных специализаций
   * @returns массив ключей выбранных специализаций
   * @private
   */
  private getSelectedSpecializations(): string[] {
    return this.specializationKeys
      .filter(key => this.organisationForm.value.specialization[key]);
  }

  /**
   * Формирование запроса на регистрацию
   * @param selectedSpecializations - выбранные специализации
   * @returns объект запроса
   * @private
   */
  private buildRegisterRequest(selectedSpecializations: string[]): OrganisationRegisterRequest {
    return {
      organization: this.organisationForm.value.organization,
      iinBin: this.organisationForm.value.iinBin,
      judAddress: this.organisationForm.value.judAddress,
      fullName: this.organisationForm.value.fullName,
      position: this.organisationForm.value.position,
      type: this.organisationForm.value.type,
      field: this.organisationForm.value.field,
      specialization: selectedSpecializations,
      yearsOfExperience: this.organisationForm.value.yearsOfExperience,
      cityId: this.organisationForm.value.cityId,
      email: this.organisationForm.value.email,
      phone: this.organisationForm.value.phone,
      password: this.organisationForm.value.password,
    };
  }

  /**
   * Загрузка файлов после успешной регистрации
   * @private
   */
  private uploadFiles(): void {
    const fileUploads: Observable<any>[] = [];

    if (this.representativeDocumentsFile) {
      fileUploads.push(this.authService.uploadRepresentativeDocuments(this.representativeDocumentsFile));
    }

    if (this.licenseFile) {
      fileUploads.push(this.authService.uploadLicense(this.licenseFile, 'Лицензия'));
    }

    if (fileUploads.length > 0) {
      this.handleFileUploads(fileUploads);
    } else {
      this.completeRegistration();
    }
  }

  /**
   * Обработка загрузки файлов
   * @param fileUploads - массив Observable для загрузки
   * @private
   */
  private handleFileUploads(fileUploads: Observable<any>[]): void {
    this.isUploading = true;
    
    forkJoin(fileUploads).subscribe({
      next: () => {
        this.isUploading = false;
        this.successMessage = 'Регистрация и загрузка документов прошли успешно!';
        this.redirectToLogin(2000);
      },
      error: (error) => {
        this.isUploading = false;
        this.errorMessage = this.extractErrorMessage(error, 'Регистрация прошла, но произошла ошибка при загрузке файлов. Попробуйте загрузить их позже в личном кабинете.');
        console.error('File upload error:', error);
        this.redirectToLogin(3000);
      }
    });
  }

  /**
   * Завершение регистрации без файлов
   * @private
   */
  private completeRegistration(): void {
    this.successMessage = 'Регистрация прошла успешно!';
    this.redirectToLogin(2000);
  }

  /**
   * Перенаправление на страницу входа
   * @param delay - задержка в миллисекундах
   * @private
   */
  private redirectToLogin(delay: number): void {
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, delay);
  }

  /**
   * Очистка сообщений
   * @private
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Извлечение сообщения об ошибке из HTTP-ответа
   * @param err - ошибка HTTP
   * @param defaultMessage - сообщение по умолчанию
   * @returns понятное сообщение об ошибке
   * @private
   */
  private extractErrorMessage(err: HttpErrorResponse, defaultMessage: string): string {
    if (err.error instanceof ProgressEvent) {
      return 'Не удалось подключиться к серверу. Пожалуйста, проверьте ваше интернет-соединение или попробуйте позже.';
    } else if (typeof err.error === 'string') {
      return err.error;
    } else if (err.error && typeof err.error === 'object' && err.error.message) {
      return err.error.message;
    } else if (err.error && typeof err.error === 'object' && err.error.error) {
      return err.error.error;
    } else if (err.status === 400) {
      return 'Некорректные данные. Пожалуйста, проверьте все поля.';
    } else if (err.status === 0) {
      return 'Не удалось связаться с сервером. Возможно, сервер недоступен или проблема с CORS.';
    }
    return defaultMessage;
  }
}