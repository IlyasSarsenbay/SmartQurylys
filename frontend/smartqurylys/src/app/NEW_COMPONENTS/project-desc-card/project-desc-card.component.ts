import { Component, Input, OnInit } from '@angular/core';
import { Project, PROJECT_STATUS_RU } from '../../core/models/project';
import { ProjectService } from '../../core/project.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-project-desc-card',
  standalone: true,
  imports: [],
  templateUrl: './project-desc-card.component.html',
  styleUrl: './project-desc-card.component.css'
})
export class ProjectDescCardComponent {
  PROJECT_STATUS_RU = PROJECT_STATUS_RU
  @Input({required: true}) project!: Project

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) { }


}
