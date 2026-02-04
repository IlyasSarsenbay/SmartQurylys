import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectResponse } from '../../core/models/project';
import { ProjectService } from '../../core/project.service';
import { Router } from '@angular/router'; // Import Router
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin-project-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-project-management.component.html',
  styleUrls: ['./admin-project-management.component.css']
})
export class AdminProjectManagementComponent implements OnInit {
  projects: ProjectResponse[] = [];
  loading: boolean = true;
  errorMessage: string = '';

  constructor(private projectService: ProjectService, private router: Router) { } // Inject Router

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.errorMessage = '';
    this.projectService.getAllProjects().pipe(
      catchError(error => {
        console.error('Error loading projects:', error);
        this.errorMessage = 'Ошибка загрузки проектов.';
        this.loading = false;
        return of([]); // Return an empty array on error
      })
    ).subscribe(projects => {
      this.projects = projects;
      this.loading = false;
    });
  }

  viewProject(projectId: number): void {
    console.log('Navigating to view project:', projectId);
    this.router.navigate(['/admin/projects/view', projectId]); // Navigate to a placeholder view route
  }

  editProject(projectId: number): void {
    console.log('Navigating to edit project:', projectId);
    this.router.navigate(['/admin/projects/edit', projectId]); // Navigate to a placeholder edit route
  }

  deleteProject(projectId: number): void {
    if (confirm('Вы уверены, что хотите удалить этот проект?')) {
      this.projectService.deleteProject(projectId).subscribe({
        next: () => {
          console.log('Project deleted:', projectId);
          this.loadProjects(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting project:', error);
          this.errorMessage = 'Ошибка при удалении проекта.';
        }
      });
    }
  }
}
