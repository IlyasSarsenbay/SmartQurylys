import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { ProjectPageHeader } from '../project-page-header/project-page-header.component';
import { ProjectService } from '../../core/project.service';

@Component({
  selector: 'app-project-layout',
  standalone: true,
  imports: [RouterOutlet, ProjectPageHeader],
  templateUrl: './project-layout.component.html',
  styleUrl: './project-layout.component.css'
})
export class ProjectLayoutComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const projectId = Number(params.get('id'));

      if (!Number.isNaN(projectId)) {
        this.projectService.setActiveProject(projectId).subscribe();
      }
    });
  }
}
