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

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-detail-container" *ngIf="userForm">
      <h2>Детали пользователя</h2>
      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
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
        <div class="form-group">
            <label for="organization">Организация</label>
            <input id="organization" formControlName="organization" class="form-input" [readonly]="true" [placeholder]="userForm.get('organization')?.value ? '' : 'Организация отсутствует'">
        </div>
        <button type="submit" class="form-button">Сохранить изменения</button>
      </form>
      <div *ngIf="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .admin-detail-container {
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin: 20px;
    }
    h2 {
      font-size: 1.8rem;
      color: #2c3e50;
      margin-bottom: 25px;
      border-bottom: 2px solid #ebf0f5;
      padding-bottom: 15px;
    }
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
  userId: number | null = null;
  userForm!: FormGroup;
  cities: City[] = [];
  roles = ['USER', 'ADMIN'];
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private userService: UserService,
    private cityService: CityService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.userId = Number(params.get('id'));
      if (this.userId) {
        forkJoin({
          user: this.userService.getUserById(this.userId),
          cities: this.cityService.getAllCities(),
          role: this.userService.getUserRole(this.userId)
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
    });
  }

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

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.userForm.invalid) {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    if (this.userId) {
      const formValue = this.userForm.getRawValue();
      
      const updateUserRequest: UpdateUserRequest = {
        fullName: formValue.fullName,
        phone: formValue.phone,
        iinBin: formValue.iinBin,
        cityId: formValue.cityId
      };
      
      const updateUser$ = this.userService.updateUser(this.userId, updateUserRequest).pipe(
        map(() => true), // Map void response to true for forkJoin success
        catchError(error => {
          console.error('Error updating user:', error);
          this.errorMessage = 'Ошибка при обновлении данных пользователя: ' + (error.error?.message || error.statusText);
          return of(false); // Return false to indicate failure for forkJoin
        })
      );

      const updateUserRole$ = this.userService.updateUserRole(this.userId, formValue.role).pipe(
        map(() => true), // Map void response to true for forkJoin success
        catchError(error => {
          console.error('Error updating role:', error);
          this.errorMessage = 'Ошибка при обновлении роли: ' + (error.error?.message || error.statusText);
          return of(false); // Return false to indicate failure for forkJoin
        })
      );

      forkJoin([updateUser$, updateUserRole$]).subscribe(([userUpdated, roleUpdated]) => {
        if (userUpdated && roleUpdated) {
          this.successMessage = 'Данные пользователя и роль успешно обновлены!';
          // Reload user data to update form with latest changes including role
          this.userService.getUserById(this.userId!).pipe(
            catchError(error => {
              console.error('Error reloading user after update:', error);
              this.errorMessage = 'Данные обновлены, но не удалось перезагрузить пользователя: ' + (error.error?.message || error.statusText);
              return of(null);
            })
          ).subscribe(reloadedUser => {
            if (reloadedUser) {
              this.userService.getUserRole(this.userId!).pipe(
                catchError(error => of(reloadedUser.role)) // Fallback to current role if loading fails
              ).subscribe(currentRole => {
                this.initializeForm(reloadedUser, currentRole);
              });
            }
          });
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          // Error messages are already set by the catchError blocks
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }
}