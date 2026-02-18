import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { UserResponse, UpdateUserRequest } from '../../../core/models/user';
import { CityService } from '../../../core/city.service';
import { City } from '../../../core/models/city';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Компонент для просмотра и редактирования детальной информации пользователя
 * @description Позволяет администратору просматривать и редактировать данные пользователя,
 * включая личную информацию и роль в системе
 */
@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- ===== КОНТЕЙНЕР ДЕТАЛЕЙ ПОЛЬЗОВАТЕЛЯ ===== -->
    <div class="admin-detail-container" *ngIf="userForm">
      <h2>Детали пользователя</h2>
      
      <!-- ===== ФОРМА РЕДАКТИРОВАНИЯ ===== -->
      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        
        <!-- Личные данные -->
        <div class="form-group">
          <label for="fullName">Полное имя</label>
          <input id="fullName" formControlName="fullName" class="form-input">
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" formControlName="email" class="form-input" [readonly]="true">
        </div>
        
        <div class="form-group">
          <label for="phone">Телефон</label>
          <input id="phone" formControlName="phone" class="form-input">
        </div>
        
        <div class="form-group">
          <label for="iinBin">ИИН/БИН</label>
          <input id="iinBin" formControlName="iinBin" class="form-input">
        </div>
        
        <!-- Город и роль -->
        <div class="form-group">
          <label for="cityId">Город</label>
          <select id="cityId" formControlName="cityId" class="form-input">
            <option *ngFor="let city of cities" [value]="city.id">{{ city.name }}</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="role">Роль</label>
          <select id="role" formControlName="role" class="form-input">
            <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
          </select>
        </div>
        
        <!-- Организация (только для чтения) -->
        <div class="form-group">
          <label for="organization">Организация</label>
          <input 
            id="organization" 
            formControlName="organization" 
            class="form-input" 
            [readonly]="true" 
            [placeholder]="userForm.get('organization')?.value ? '' : 'Организация отсутствует'">
        </div>
        
        <!-- Кнопка отправки -->
        <button type="submit" class="form-button">Сохранить изменения</button>
      </form>
      
      <!-- ===== СООБЩЕНИЯ ===== -->
      <div *ngIf="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      
      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    /* ===== ОСНОВНОЙ КОНТЕЙНЕР ===== */
    .admin-detail-container {
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin: 20px;
    }
    
    /* ===== ЗАГОЛОВОК ===== */
    h2 {
      font-size: 1.8rem;
      color: #2c3e50;
      margin-bottom: 25px;
      border-bottom: 2px solid #ebf0f5;
      padding-bottom: 15px;
    }
    
    /* ===== ЭЛЕМЕНТЫ ФОРМЫ ===== */
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-input {
      width: 100%;
      padding: 8px;
      margin-top: 5px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    /* ===== КНОПКА ===== */
    .form-button {
      background-color: #007bff;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    
    .form-button:hover {
      background-color: #0056b3;
    }
    
    /* ===== СООБЩЕНИЯ ===== */
    .success-message {
      color: green;
      background-color: #e6ffe6;
      border: 1px solid green;
      padding: 10px;
      margin-top: 10px;
      border-radius: 4px;
    }
    
    .error-message {
      color: red;
      background-color: #ffe6e6;
      border: 1px solid red;
      padding: 10px;
      margin-top: 10px;
      border-radius: 4px;
    }
  `]
})
export class AdminUserDetailComponent implements OnInit {
  /** ID текущего пользователя из URL */
  userId: number | null = null;
  
  /** Реактивная форма для редактирования данных пользователя */
  userForm!: FormGroup;
  
  /** Список доступных городов */
  cities: City[] = [];
  
  /** Доступные роли в системе */
  roles = ['USER', 'ADMIN'];
  
  /** Сообщение об успешном выполнении */
  successMessage: string = '';
  
  /** Сообщение об ошибке */
  errorMessage: string = '';

  /**
   * Конструктор компонента
   * @param route - для получения параметров из URL
   * @param fb - для создания реактивной формы
   * @param userService - сервис для работы с пользователями
   * @param cityService - сервис для получения списка городов
   */
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private userService: UserService,
    private cityService: CityService
  ) {}

  /**
   * Загрузка данных при инициализации компонента
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.userId = Number(params.get('id'));
      if (this.userId) {
        this.loadUserData();
      }
    });
  }

  /**
   * Загрузка данных пользователя, списка городов и роли
   * @private
   */
  private loadUserData(): void {
    forkJoin({
      user: this.userService.getUserById(this.userId!),
      cities: this.cityService.getAllCities(),
      role: this.userService.getUserRole(this.userId!)
    }).subscribe({
      next: ({ user, cities, role }) => {
        this.cities = cities;
        this.initializeForm(user, role);
      },
      error: (error) => {
        this.errorMessage = 'Ошибка загрузки данных пользователя: ' + (error.message || error.statusText);
        console.error('Error loading user data:', error);
      }
    });
  }

  /**
   * Инициализация формы данными пользователя
   * @param user - данные пользователя
   * @param role - роль пользователя
   */
  initializeForm(user: UserResponse, role: string): void {
    const city = this.cities.find(c => c.name === user.city);
    this.userForm = this.fb.group({
      fullName: [user.fullName, Validators.required],
      email: [{value: user.email, disabled: true}, [Validators.required, Validators.email]],
      phone: [user.phone],
      iinBin: [user.iinBin],
      cityId: [city ? city.id : null],
      role: [role],
      organization: [{value: user.organization, disabled: true}],
    });
  }

  /**
   * Обработчик отправки формы обновления пользователя
   * Обновляет одновременно данные пользователя и его роль
   */
  onSubmit(): void {
    this.clearMessages();
    
    if (this.userForm.invalid) {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    if (this.userId) {
      const formValue = this.userForm.getRawValue();
      
      // Параллельное обновление данных и роли
      forkJoin({
        user: this.updateUserData(formValue),
        role: this.updateUserRole(formValue.role)
      }).subscribe({
        next: (results) => {
          if (results.user && results.role) {
            this.handleUpdateSuccess();
          }
        },
        error: () => {
          // Ошибки уже обработаны в отдельных catchError
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  /**
   * Обновление основных данных пользователя
   * @param formValue - значения из формы
   * @private
   */
  private updateUserData(formValue: any) {
    const updateUserRequest: UpdateUserRequest = {
      fullName: formValue.fullName,
      phone: formValue.phone,
      iinBin: formValue.iinBin,
      cityId: formValue.cityId
    };
    
    return this.userService.updateUser(this.userId!, updateUserRequest).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error updating user:', error);
        this.errorMessage = 'Ошибка при обновлении данных пользователя: ' + (error.error?.message || error.statusText);
        return of(false);
      })
    );
  }

  /**
   * Обновление роли пользователя
   * @param role - новая роль
   * @private
   */
  private updateUserRole(role: string) {
    return this.userService.updateUserRole(this.userId!, role).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error updating role:', error);
        this.errorMessage = 'Ошибка при обновлении роли: ' + (error.error?.message || error.statusText);
        return of(false);
      })
    );
  }

  /**
   * Обработка успешного обновления
   * @private
   */
  private handleUpdateSuccess(): void {
    this.successMessage = 'Данные пользователя и роль успешно обновлены!';
    
    // Перезагрузка данных для обновления формы
    this.reloadUserData();
    
    setTimeout(() => this.successMessage = '', 3000);
  }

  /**
   * Перезагрузка данных пользователя после обновления
   * @private
   */
  private reloadUserData(): void {
    forkJoin({
      user: this.userService.getUserById(this.userId!).pipe(
        catchError(error => {
          console.error('Error reloading user after update:', error);
          this.errorMessage = 'Данные обновлены, но не удалось перезагрузить пользователя';
          return of(null);
        })
      ),
      role: this.userService.getUserRole(this.userId!).pipe(
        catchError(error => of(null))
      )
    }).subscribe(({ user, role }) => {
      if (user && role) {
        this.initializeForm(user, role);
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
}