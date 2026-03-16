import { Component, Input, OnInit } from '@angular/core';
import { Project, PROJECT_STATUS_RU } from '../../core/models/project';
import { ProjectService } from '../../core/project.service';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { ProjectStatus } from '../../core/enums/project-status.enum';

@Component({
  selector: 'app-project-desc-card',
  standalone: true,
  imports: [NgClass, DatePipe],
  templateUrl: './project-desc-card.component.html',
  styleUrl: './project-desc-card.component.css'
})
export class ProjectDescCardComponent {
  PROJECT_STATUS_RU = PROJECT_STATUS_RU
  @Input({ required: true }) project!: Project

  isStatusMenuOpen = false

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) { }

  toggleStatusMenu() {
    this.isStatusMenuOpen = !this.isStatusMenuOpen;
  }

  changeStatus(newStatus: string): void {
    this.project.status = newStatus as ProjectStatus;
    this.isStatusMenuOpen = false;

    this.projectService.updateProject(this.project)
      .subscribe(value => this.project = this.project)
  }
}
