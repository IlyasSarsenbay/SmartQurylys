import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/project.service';
import { Project, ProjectResponse } from '../../core/models/project';
import { Router, RouterLink } from "@angular/router";
import { PROJECT_STATUS_RU } from '../../core/models/project';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-projects-panel',
  standalone: true,
  imports: [FormsModule, RouterLink, NgClass],
  templateUrl: './projects-panel.component.html',
  styleUrl: './projects-panel.component.css'
})
export class ProjectsPanelComponent implements OnInit {
  selectedFilter: 'all' | 'name' | 'status' | 'contractor' = 'all';
  PROJECT_STATUS_RU = PROJECT_STATUS_RU;

  projects!: Project[]
  @Output() closePanelCommand = new EventEmitter<void>();

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.projectService.getMyProjects()
      .subscribe(value => {
        this.projects = value.sort((a, b) => a.id - b.id)

        console.log(value)
      })

  }

  onClickCreateProject() {
    this.closePanelCommand.emit()
  }

  onClickProject(project: Project) {
    this.closePanelCommand.emit()
    this.router.navigate(['/projects', project.id])
  }

  toggleFavorite(project: Project) {
    project.favorite = !project.favorite
  }
}
