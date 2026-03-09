import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserResponse } from '../../core/models/user';
import { UserService } from '../../core/user.service';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Компонент для управления пользователями в административной панели
 * @description Отображает список всех пользователей с возможностью просмотра и удаления
 */
@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css']
})
export class AdminUserManagementComponent implements OnInit {
  /** Список пользователей */
  users: UserResponse[] = [];
  
  /** Флаг загрузки данных */
  loading: boolean = true;
  
  /** Сообщение об ошибке */
  errorMessage: string = '';

  /**
   * Конструктор компонента
   * @param userService - сервис для работы с пользователями
   * @param router - для навигации между страницами
   */
  constructor(
    private userService: UserService,
    private router: Router
  ) { }

  /**
   * Инициализация компонента
   * Загружает список пользователей при создании компонента
   */
  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Загрузка списка всех пользователей с сервера
   * Управляет состояниями загрузки и ошибок
   */
  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.userService.getAllUsers().pipe(
      catchError(error => {
        console.error('Error loading users:', error);
        this.errorMessage = 'Ошибка загрузки пользователей.';
        this.loading = false;
        return of([]); // Возвращаем пустой массив при ошибке
      })
    ).subscribe(users => {
      this.users = users;
      this.loading = false;
    });
  }

  /**
   * Переход к странице просмотра деталей пользователя
   * @param userId - ID пользователя для просмотра
   */
  viewUser(userId: number): void {
    console.log('Navigating to view user:', userId);
    this.router.navigate(['/admin/users/view', userId]);
  }

  /**
   * Переход к странице редактирования пользователя
   * @param userId - ID пользователя для редактирования
   */
  editUser(userId: number): void {
    console.log('Navigating to edit user:', userId);
    this.router.navigate(['/admin/users/edit', userId]);
  }

  /**
   * Удаление пользователя после подтверждения
   * @param userId - ID пользователя для удаления
   */
  deleteUser(userId: number): void {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          console.log('User deleted:', userId);
          this.loadUsers(); // Обновляем список после удаления
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.errorMessage = 'Ошибка при удалении пользователя.';
        }
      });
    }
  }
}