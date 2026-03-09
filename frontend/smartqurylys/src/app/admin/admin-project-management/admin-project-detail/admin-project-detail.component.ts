import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/project.service';
import { ProjectResponse } from '../../../core/models/project';
import { UpdateProjectRequest } from '../../../core/models/project-requests';
import { CityService } from '../../../core/city.service';
import { City } from '../../../core/models/city';
import { ProjectStatus } from '../../../core/enums/project-status.enum';
import { forkJoin } from 'rxjs';

/**
 * Компонент для просмотра и редактирования детальной информации проекта
 * @description Позволяет администратору просматривать и редактировать данные проекта
 */
@Component({
  selector: 'app-admin-project-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-project-detail.component.html',
  styleUrls: ['./admin-project-detail.component.css']
})
export class AdminProjectDetailComponent implements OnInit {
  /** ID текущего проекта из URL */
  projectId: number | null = null;
  
  /** Реактивная форма для редактирования данных проекта */
  projectForm: FormGroup;
  
  /** Список доступных городов */
  cities: City[] = [];
  
  /** Список статусов проекта (из enum) */
  projectStatuses = Object.values(ProjectStatus);
  
  /** Сообщение об успешном выполнении */
  successMessage: string = '';
  
  /** Сообщение об ошибке */
  errorMessage: string = '';

  /**
   * Конструктор компонента
   * @param route - для получения параметров из URL
   * @param fb - для создания реактивной формы
   * @param projectService - сервис для работы с проектами
   * @param cityService - сервис для получения списка городов
   */
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private projectService: ProjectService,
    private cityService: CityService
  ) {
    // Инициализация формы с валидацией
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      type: ['', Validators.required],
      status: [ProjectStatus.DRAFT, Validators.required], // Статус по умолчанию
      cityId: [null, Validators.required],
    });
  }

  /**
   * Загрузка данных при инициализации компонента
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.projectId = Number(params.get('id'));
      if (this.projectId) {
        this.loadProjectData();
      }
    });
  }

  /**
   * Загрузка данных проекта и списка городов
   * @private
   */
  private loadProjectData(): void {
    forkJoin({
      project: this.projectService.getProjectById(this.projectId!),
      cities: this.cityService.getAllCities()
    }).subscribe({
      next: ({ project, cities }) => {
        console.log('Fetched Project Data:', project);
        console.log('Fetched Cities Data:', cities);
        
        this.cities = cities;
        this.patchFormWithProjectData(project);
      },
      error: (error) => {
        this.errorMessage = 'Ошибка загрузки данных проекта: ' + (error.message || error.statusText);
        console.error('Error loading project data:', error);
      }
    });
  }

  /**
   * Заполнение формы данными проекта
   * @param project - данные проекта из API
   * @private
   */
  private patchFormWithProjectData(project: ProjectResponse): void {
    const projectCity = this.cities.find(city => city.name === project.cityName);
    
    this.projectForm.patchValue({
      name: project.name ?? '',
      description: project.description ?? '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      type: project.type ?? '',
      status: project.status ?? ProjectStatus.DRAFT,
      cityId: projectCity ? projectCity.id : null,
    });
  }

  /**
   * Обработчик отправки формы обновления проекта
   */
  onSubmit(): void {
    this.clearMessages();
    
    if (this.projectForm.valid && this.projectId) {
      const request = this.buildUpdateRequest();
      
      this.projectService.updateProject(this.projectId, request).subscribe({
        next: (updatedProject) => {
          this.successMessage = 'Данные проекта успешно обновлены!';
          console.log('Project updated:', updatedProject);
          
          this.patchFormWithProjectData(updatedProject);
          
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.handleError('обновлении проекта', error);
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  /**
   * Формирование запроса на обновление из данных формы
   * @private
   */
  private buildUpdateRequest(): UpdateProjectRequest {
    const formValue = this.projectForm.value;

    return {
      name: formValue.name,
      description: formValue.description,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      type: formValue.type,
      status: formValue.status,
      cityId: formValue.cityId,
    };
  }

  /**
   * Очистка сообщений об успехе и ошибке
   * @private
   */
  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Обработка ошибок с единообразным сообщением
   * @param action - действие, при котором произошла ошибка
   * @param error - объект ошибки
   * @private
   */
  private handleError(action: string, error: any): void {
    this.errorMessage = `Ошибка при ${action}: ` + 
      (error.error?.message || error.statusText || error.message);
    console.error(`Error during ${action}:`, error);
    setTimeout(() => this.errorMessage = '', 5000);
  }
}