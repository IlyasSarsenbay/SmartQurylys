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

@Component({
  selector: 'app-admin-project-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-project-detail.component.html',
  styleUrls: ['./admin-project-detail.component.css']
})
export class AdminProjectDetailComponent implements OnInit {
  projectId: number | null = null;
  projectForm: FormGroup;
  cities: City[] = [];
  projectStatuses = Object.values(ProjectStatus);
  successMessage: string = '';
  errorMessage: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private projectService: ProjectService,
    private cityService: CityService
  ) {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      type: ['', Validators.required],
      status: [ProjectStatus.DRAFT, Validators.required], // Default status
      cityId: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.projectId = Number(params.get('id'));
      if (this.projectId) {
        forkJoin({
          project: this.projectService.getProjectById(this.projectId),
          cities: this.cityService.getAllCities()
        }).subscribe({
          next: ({ project, cities }) => {
            console.log('Fetched Project Data:', project);
            console.log('Fetched Cities Data:', cities);
            this.cities = cities;
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
          },
          error: (error) => {
            this.errorMessage = 'Ошибка загрузки данных проекта: ' + (error.message || error.statusText);
            console.error('Error loading project data:', error);
          }
        });
      }
    });
  }

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.projectForm.valid && this.projectId) {
      const formValue = this.projectForm.value;

      const request: UpdateProjectRequest = {
        name: formValue.name,
        description: formValue.description,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        type: formValue.type,
        status: formValue.status,
        cityId: formValue.cityId,
      };

      this.projectService.updateProject(this.projectId, request).subscribe({
        next: (updatedProject) => {
          this.successMessage = 'Данные проекта успешно обновлены!';
          console.log('Project updated:', updatedProject);
          const updatedProjectCity = this.cities.find(city => city.name === updatedProject.cityName);
          this.projectForm.patchValue({
            name: updatedProject.name ?? '',
            description: updatedProject.description ?? '',
            startDate: updatedProject.startDate ? new Date(updatedProject.startDate).toISOString().split('T')[0] : '',
            endDate: updatedProject.endDate ? new Date(updatedProject.endDate).toISOString().split('T')[0] : '',
            type: updatedProject.type ?? '',
            status: updatedProject.status ?? ProjectStatus.DRAFT,
            cityId: updatedProjectCity ? updatedProjectCity.id : null,
          });
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = 'Ошибка при обновлении проекта: ' + (error.error?.message || error.statusText || error.message);
          console.error('Error updating project:', error);
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }
}