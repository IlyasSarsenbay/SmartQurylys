import { Component } from '@angular/core';
import { ProjectPageHeader } from "../project-page-header/project-page-header.component";

@Component({
  selector: 'app-project-tasks-page',
  standalone: true,
  imports: [ProjectPageHeader],
  templateUrl: './project-tasks-page.component.html',
  styleUrl: './project-tasks-page.component.css'
})
export class ProjectTasksPageComponent {

}
