import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { AuthService } from '../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { PasswordResetRequest } from '../../core/models/auth';
import { Router } from '@angular/router';

/**
 * Кастомный валидатор для проверки совпадения паролей
 * @param control - группа формы, содержащая поля newPassword и confirmPassword
 * @returns объект с ошибкой passwordMismatch или null
 */
const passwordMatchValidator: ValidatorFn = (control: AbstractControl): { [key: string]: any } | null => {
  const formGroup = control as FormGroup;
  const newPassword = formGroup.get('newPassword')?.value;
  const confirmPassword = formGroup.get('confirmPassword')?.value;

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    if (formGroup.get('confirmPassword')?.hasError('passwordMismatch')) {
      formGroup.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }
};

/**
 * Компонент для восстановления пароля
 * @description Двухшаговый процесс:
 * 1. Отправка кода подтверждения на email
 * 2. Сброс пароля с использованием полученного кода
 */
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  /** Форма восстановления пароля */
  forgotPasswordForm: FormGroup;
  
  /** Сообщение об ошибке */
  errorMessage: string = '';
  
  /** Сообщение об успехе */
  successMessage: string = '';
  
  /** Флаг: код отправлен, показываем поля для сброса пароля */
  codeSent: boolean = false;
  
  /** Флаг: пароль успешно сброшен */
  passwordResetSuccess: boolean = false; 

  /**
   * Конструктор компонента
   * @param fb - для создания реактивной формы
   * @param authService - сервис аутентификации
   * @param router - для навигации
   */
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router 
  ) {
    // Инициализация формы с валидацией
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    // По умолчанию поля кода и паролей отключены (до отправки email)
    this.forgotPasswordForm.get('code')?.disable();
    this.forgotPasswordForm.get('newPassword')?.disable();
    this.forgotPasswordForm.get('confirmPassword')?.disable();
  }

  ngOnInit(): void { }

  /**
   * Обработчик отправки формы
   * Работает в двух режимах:
   * 1. codeSent = false - отправка кода на email
   * 2. codeSent = true - сброс пароля с кодом
   */
  onSubmit(): void {
    this.clearMessages();

    if (!this.codeSent) {
      this.handleSendCode();
    } else {
      this.handleResetPassword();
    }
  }

  /**
   * Обработка первого шага - отправка кода на email
   * @private
   */
  private handleSendCode(): void {
    const emailControl = this.forgotPasswordForm.get('email');
    
    if (emailControl?.valid) {
      this.authService.forgotPassword({ contact: emailControl.value }).subscribe({
        next: (response) => {
          this.successMessage = response;
          this.codeSent = true;
          
          // Отключаем email, включаем поля для кода и паролей
          emailControl.disable();
          this.forgotPasswordForm.get('code')?.enable();
          this.forgotPasswordForm.get('newPassword')?.enable();
          this.forgotPasswordForm.get('confirmPassword')?.enable();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error sending password reset code:', err);
          this.errorMessage = this.extractErrorMessage(err, 'Ошибка при отправке кода. Пожалуйста, проверьте email.');
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, введите корректный email.';
      emailControl?.markAsTouched();
    }
  }

  /**
   * Обработка второго шага - сброс пароля с кодом
   * @private
   */
  private handleResetPassword(): void {
    // Временно включаем email для отправки формы
    this.forgotPasswordForm.get('email')?.enable();

    if (this.forgotPasswordForm.valid) {
      const request: PasswordResetRequest = {
        contact: this.forgotPasswordForm.get('email')?.value,
        code: this.forgotPasswordForm.get('code')?.value,
        newPassword: this.forgotPasswordForm.get('newPassword')?.value
      };

      this.authService.resetPassword(request).subscribe({
        next: (response) => {
          this.successMessage = response; // "Пароль успешно сброшен"
          this.passwordResetSuccess = true;
          
          // Отключаем всю форму после успешного сброса
          this.forgotPasswordForm.disable();
          
          // Перенаправляем на страницу входа через 3 секунды
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error resetting password:', err);
          this.errorMessage = this.extractErrorMessage(err, 'Ошибка при сбросе пароля. Проверьте код и новый пароль.');
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все поля правильно и убедитесь, что пароли совпадают.';
      this.forgotPasswordForm.markAllAsTouched();
    }
    
    // Снова отключаем email
    this.forgotPasswordForm.get('email')?.disable();
  }

  /**
   * Извлечение понятного сообщения об ошибке из HTTP-ответа
   * @param err - ошибка HTTP
   * @param defaultMessage - сообщение по умолчанию
   * @returns понятное сообщение об ошибке
   * @private
   */
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
      return err.error || 'Некорректные данные. Пожалуйста, проверьте введенную информацию.';
    } else if (err.status === 0) {
      return 'Не удалось связаться с сервером. Возможно, сервер недоступен или проблема с CORS.';
    }
    return defaultMessage;
  }

  /**
   * Очистка сообщений об успехе и ошибке
   * @private
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
