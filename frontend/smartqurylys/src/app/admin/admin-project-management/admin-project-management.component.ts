import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectResponse } from '../../core/models/project';
import { ProjectService } from '../../core/project.service';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Компонент для управления проектами в административной панели
 * @description Отображает список всех проектов с возможностью просмотра и удаления
 */
@Component({
  selector: 'app-admin-project-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-project-management.component.html',
  styleUrls: ['./admin-project-management.component.css']
})
export class AdminProjectManagementComponent implements OnInit {
  /** Список проектов */
  projects: ProjectResponse[] = [];
  
  /** Флаг загрузки данных */
  loading: boolean = true;
  
  /** Сообщение об ошибке */
  errorMessage: string = '';

  /**
   * Конструктор компонента
   * @param projectService - сервис для работы с проектами
   * @param router - для навигации между страницами
   */
  constructor(
    private projectService: ProjectService,
    private router: Router
  ) { }

  /**
   * Инициализация компонента
   * Загружает список проектов при создании компонента
   */
  ngOnInit(): void {
    this.loadProjects();
  }

  /**
   * Загрузка списка всех проектов с сервера
   * Управляет состояниями загрузки и ошибок
   */
  loadProjects(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.projectService.getAllProjects().pipe(
      catchError(error => {
        console.error('Error loading projects:', error);
        this.errorMessage = 'Ошибка загрузки проектов.';
        this.loading = false;
        return of([]); // Возвращаем пустой массив при ошибке
      })
    ).subscribe(projects => {
      this.projects = projects;
      this.loading = false;
    });
  }

  /**
   * Переход к странице просмотра деталей проекта
   * @param projectId - ID проекта для просмотра
   */
  viewProject(projectId: number): void {
    console.log('Navigating to view project:', projectId);
    this.router.navigate(['/admin/projects/view', projectId]);
  }

  /**
   * Переход к странице редактирования проекта
   * @param projectId - ID проекта для редактирования
   */
  editProject(projectId: number): void {
    console.log('Navigating to edit project:', projectId);
    this.router.navigate(['/admin/projects/edit', projectId]);
  }

  /**
   * Удаление проекта после подтверждения пользователя
   * @param projectId - ID проекта для удаления
   */
  deleteProject(projectId: number): void {
    if (confirm('Вы уверены, что хотите удалить этот проект?')) {
      this.projectService.deleteProject(projectId).subscribe({
        next: () => {
          console.log('Project deleted:', projectId);
          this.loadProjects(); // Обновляем список после удаления
        },
        error: (error) => {
          console.error('Error deleting project:', error);
          this.errorMessage = 'Ошибка при удалении проекта.';
        }
      });
    }
  }
}
