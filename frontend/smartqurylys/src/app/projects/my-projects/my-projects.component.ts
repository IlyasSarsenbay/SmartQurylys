import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../core/project.service';
import { ProjectResponse } from '../../core/models/project';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-my-projects',
  standalone: true, 
  imports: [CommonModule, RouterModule],
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.css']
})
export class MyProjectsComponent implements OnInit {
  projects$: Observable<ProjectResponse[]>;
  errorMessage: string = '';

  constructor(private projectService: ProjectService) {
    this.projects$ = this.projectService.getMyProjects().pipe(
      catchError(error => {
        console.error('Error fetching my projects:', error);
        this.errorMessage = 'Не удалось загрузить ваши проекты. Пожалуйста, попробуйте позже.';
        return of([]);
      })
    );
  }

  ngOnInit(): void {
  }
}