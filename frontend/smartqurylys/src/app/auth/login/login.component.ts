import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LoginRequest } from '../../core/models/auth';
import { HttpErrorResponse } from '@angular/common/http'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (this.loginForm.valid) {
      const request: LoginRequest = this.loginForm.value;
      this.authService.login(request).subscribe({
        next: (token) => {
          console.log('Login successful, token:', token);
          this.router.navigate(['/home']);
        },
        error: (err: HttpErrorResponse) => { 
          console.error('Login failed:', err);

        
          if (err.error instanceof ProgressEvent) {
            this.errorMessage = 'Не удалось подключиться к серверу. Пожалуйста, проверьте ваше интернет-соединение или попробуйте позже.';
          } else if (typeof err.error === 'string') {
            
            this.errorMessage = err.error;
          } else if (err.error && typeof err.error === 'object' && err.error.message) {
        
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = 'Произошла неизвестная ошибка. Пожалуйста, попробуйте еще раз.';
          }

          if (err.status === 401) {
            this.errorMessage = this.errorMessage || 'Неверные учетные данные. Пожалуйста, проверьте ваш email и пароль.';
          } else if (err.status === 400) {
            this.errorMessage = this.errorMessage || 'Некорректный запрос. Пожалуйста, проверьте введенные данные.';
          } else if (err.status === 0) {
            this.errorMessage = this.errorMessage || 'Не удалось связаться с сервером. Возможно, сервер недоступен или проблема с CORS.';
          }
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните форму правильно.';
      this.loginForm.markAllAsTouched();
    }
  }
}