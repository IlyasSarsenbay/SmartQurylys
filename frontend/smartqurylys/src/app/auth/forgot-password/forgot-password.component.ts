import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { AuthService } from '../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { PasswordResetRequest } from '../../core/models/auth';
import { Router } from '@angular/router';

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


@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  codeSent: boolean = false;
  passwordResetSuccess: boolean = false; 

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router 
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    this.forgotPasswordForm.get('code')?.disable();
    this.forgotPasswordForm.get('newPassword')?.disable();
    this.forgotPasswordForm.get('confirmPassword')?.disable();
  }

  ngOnInit(): void { }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.codeSent) {
      // Шаг 1: Отправка кода подтверждения
      const emailControl = this.forgotPasswordForm.get('email');
      if (emailControl?.valid) {
        this.authService.forgotPassword({ contact: emailControl.value }).subscribe({
          next: (response) => {
            this.successMessage = response;
            this.codeSent = true;
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
    } else {
      // Шаг 2: Сброс пароля с кодом
      this.forgotPasswordForm.get('email')?.enable(); // Временно включаем email для отправки

      if (this.forgotPasswordForm.valid) {
        const request: PasswordResetRequest = {
          contact: this.forgotPasswordForm.get('email')?.value,
          code: this.forgotPasswordForm.get('code')?.value,
          newPassword: this.forgotPasswordForm.get('newPassword')?.value
        };

        this.authService.resetPassword(request).subscribe({
          next: (response) => {
            this.successMessage = response; // "Пароль успешно сброшен"
            this.passwordResetSuccess = true; // НОВОЕ: Устанавливаем флаг успеха
            // Отключаем всю форму после успешного сброса
            this.forgotPasswordForm.disable();
            // Перенаправляем на страницу входа через несколько секунд
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
      this.forgotPasswordForm.get('email')?.disable(); // Снова отключаем email
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
      return err.error || 'Некорректные данные. Пожалуйста, проверьте введенную информацию.';
    } else if (err.status === 0) {
      return 'Не удалось связаться с сервером. Возможно, сервер недоступен или проблема с CORS.';
    }
    return defaultMessage;
  }
}
