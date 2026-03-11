import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LoginRequest } from '../../core/models/auth';
import { HttpErrorResponse } from '@angular/common/http'; 

/**
 * Компонент для входа пользователя в систему
 * @description Отображает форму входа, обрабатывает аутентификацию
 * и перенаправляет пользователя в зависимости от его роли
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  /** Форма входа с полями email и пароль */
  loginForm: FormGroup;
  
  /** Сообщение об ошибке */
  errorMessage: string = '';

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
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  /**
   * Проверка аутентификации при загрузке компонента
   * Если пользователь уже вошел - перенаправляем на соответствующую страницу
   */
  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const userRole = this.authService.getUserRole();
      if (userRole === 'ADMIN') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/home']);
      }
    }
  }

  /**
   * Обработчик отправки формы входа
   * Отправляет данные на сервер и обрабатывает ответ
   */
  onSubmit(): void {
    this.errorMessage = '';
    
    if (this.loginForm.valid) {
      const request: LoginRequest = this.loginForm.value;
      
      this.authService.login(request).subscribe({
        next: (token) => {
          console.log('Login successful, token:', token);
          this.redirectBasedOnRole();
        },
        error: (err: HttpErrorResponse) => { 
          console.error('Login failed:', err);
          this.handleLoginError(err);
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните форму правильно.';
      this.loginForm.markAllAsTouched();
    }
  }

  /**
   * Перенаправление пользователя на основе его роли
   * @private
   */
  private redirectBasedOnRole(): void {
    const userRole = this.authService.getUserRole();
    if (userRole === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  /**
   * Обработка ошибок при входе
   * @param err - ошибка HTTP
   * @private
   */
  private handleLoginError(err: HttpErrorResponse): void {
    // Ошибка соединения
    if (err.error instanceof ProgressEvent) {
      this.errorMessage = 'Не удалось подключиться к серверу. Пожалуйста, проверьте ваше интернет-соединение или попробуйте позже.';
      return;
    }

    // Извлечение сообщения из ответа сервера
    if (typeof err.error === 'string') {
      this.errorMessage = err.error;
    } else if (err.error && typeof err.error === 'object' && err.error.message) {
      this.errorMessage = err.error.message;
    }

    // Обработка HTTP статусов
    switch (err.status) {
      case 401:
        this.errorMessage = this.errorMessage || 'Неверные учетные данные. Пожалуйста, проверьте ваш email и пароль.';
        break;
      case 400:
        this.errorMessage = this.errorMessage || 'Некорректный запрос. Пожалуйста, проверьте введенные данные.';
        break;
      case 0:
        this.errorMessage = this.errorMessage || 'Не удалось связаться с сервером. Возможно, сервер недоступен или проблема с CORS.';
        break;
      default:
        this.errorMessage = this.errorMessage || 'Произошла неизвестная ошибка. Пожалуйста, попробуйте еще раз.';
    }
  }
}