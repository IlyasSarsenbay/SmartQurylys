import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { ProjectPageHeader } from '../project-page-header/project-page-header.component';
import { ProjectService } from '../../core/project.service';
import { ProjectRealtimeService } from '../../core/project-realtime.service';

@Component({
  selector: 'app-project-layout',
  standalone: true,
  imports: [RouterOutlet, ProjectPageHeader],
  templateUrl: './project-layout.component.html',
  styleUrl: './project-layout.component.css'
})
export class ProjectLayoutComponent implements OnInit {
  private activeProjectId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private projectRealtimeService: ProjectRealtimeService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const projectId = Number(params.get('id'));

      if (!Number.isNaN(projectId)) {
        this.activeProjectId = projectId;
        this.projectService.setActiveProject(projectId).subscribe();
        this.projectRealtimeService.connectToProject(projectId);
      }
    });
  }

  ngOnDestroy(): void {
    this.activeProjectId = null;
    this.projectRealtimeService.disconnect();
  }
}
