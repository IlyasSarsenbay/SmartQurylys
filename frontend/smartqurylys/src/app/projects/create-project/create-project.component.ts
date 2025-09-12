import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../core/project.service';
import { CityService } from '../../core/city.service';
import { City } from '../../core/models/city';
import { CreateProjectRequest } from '../../core/models/project-requests';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css']
})
export class CreateProjectComponent implements OnInit {
  createProjectForm: FormGroup;
  cities$: Observable<City[]>;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private cityService: CityService,
    public router: Router
  ) {
    this.createProjectForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      type: ['', Validators.required],
      cityId: [null, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });

    this.cities$ = this.cityService.getAllCities().pipe(
      catchError(error => {
        console.error('Error loading cities:', error);
        this.errorMessage = 'Не удалось загрузить список городов.';
        return of([]);
      })
    );
  }

  ngOnInit(): void { }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.createProjectForm.valid) {
      const request: CreateProjectRequest = {
        name: this.createProjectForm.value.name,
        description: this.createProjectForm.value.description,
        type: this.createProjectForm.value.type,
        cityId: this.createProjectForm.value.cityId,
        startDate: this.createProjectForm.value.startDate,
        endDate: this.createProjectForm.value.endDate
      };

      this.projectService.createProject(request).subscribe({
        next: (project) => {
          this.successMessage = `Проект "${project.name}" успешно создан!`;
          this.createProjectForm.reset();
          setTimeout(() => {
            this.router.navigate(['/project', project.id]);
          }, 1500); 
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error creating project:', err);
          this.errorMessage = this.extractErrorMessage(err, 'Ошибка при создании проекта. Пожалуйста, попробуйте еще раз.');
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
      this.createProjectForm.markAllAsTouched();
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