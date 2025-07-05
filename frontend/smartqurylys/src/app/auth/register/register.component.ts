import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { RegisterRequest } from '../../core/models/auth';
import { CityService } from '../../core/city.service';
import { City } from '../../core/models/city';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { EmailVerificationService } from '../../core/email-verification.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  cities$: Observable<City[]>;
  errorMessage: string = '';
  successMessage: string = '';

  emailSent: boolean = false;
  emailVerified: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cityService: CityService,
    private emailVerificationService: EmailVerificationService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      verificationCode: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
      organization: ['', Validators.required],
      iinBin: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      cityId: [null, Validators.required]
    });

    this.registerForm.get('verificationCode')?.disable();

    this.cities$ = this.cityService.getAllCities().pipe(
      catchError(error => {
        console.error('Error loading cities:', error);
        this.errorMessage = 'Не удалось загрузить список городов.';
        return of([]);
      })
    );
  }

  ngOnInit(): void { }

  sendVerificationCode(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const emailControl = this.registerForm.get('email');

    if (emailControl?.valid) {
      this.emailVerificationService.sendEmailVerificationCode(emailControl.value).subscribe({
        next: (response) => {
          this.successMessage = response;
          this.emailSent = true;
          this.registerForm.get('verificationCode')?.enable();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error sending verification code:', err);
          this.errorMessage = this.extractErrorMessage(err, 'Ошибка при отправке кода.');
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, введите корректный email для отправки кода.';
      emailControl?.markAsTouched();
    }
  }

  verifyCode(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const emailControl = this.registerForm.get('email');
    const codeControl = this.registerForm.get('verificationCode');

    if (emailControl?.valid && codeControl?.valid) {
      this.emailVerificationService.verifyEmailVerificationCode(emailControl.value, codeControl.value).subscribe({
        next: (response) => {
          if (response === "Почта успешно подтверждена") {
            this.successMessage = response;
            this.emailVerified = true;
            this.registerForm.get('email')?.disable();
            this.registerForm.get('verificationCode')?.disable();
          } else {
            this.errorMessage = 'Неизвестный ответ сервера при верификации: ' + response;
            this.emailVerified = false;
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error verifying code:', err);
          this.errorMessage = this.extractErrorMessage(err, 'Ошибка при проверке кода.');
          this.emailVerified = false;
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, введите email и код подтверждения.';
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.emailVerified) {
      this.errorMessage = 'Пожалуйста, сначала подтвердите ваш email.';
      return;
    }

    this.registerForm.get('email')?.enable(); 

    if (this.registerForm.valid) {
      const request: RegisterRequest = {
        fullName: this.registerForm.value.fullName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        phone: this.registerForm.value.phone,
        organization: this.registerForm.value.organization,
        iinBin: this.registerForm.value.iinBin,
        cityId: this.registerForm.value.cityId
      };

      this.authService.register(request).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.successMessage = 'Регистрация прошла успешно!';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Registration failed:', err);
          this.errorMessage = this.extractErrorMessage(err, 'Ошибка регистрации. Пожалуйста, попробуйте еще раз.');
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните форму правильно.';
      this.registerForm.markAllAsTouched();
    }

    if (this.emailVerified) {
      this.registerForm.get('email')?.disable();
      this.registerForm.get('verificationCode')?.disable();
    }
  }

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