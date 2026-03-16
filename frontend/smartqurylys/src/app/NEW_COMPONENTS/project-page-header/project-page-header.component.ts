import { Component, Input, OnInit } from '@angular/core';
import { Project } from '../../core/models/project';
import { ProjectService } from '../../core/project.service';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { mapToUpdateProjectRequest } from '../../core/models/project-requests';
import { TaskService } from '../../core/task.service';

@Component({
  selector: 'app-project-header',
  standalone: true,
  imports: [RouterLink, FormsModule, RouterLinkActive],
  templateUrl: './project-page-header.component.html',
  styleUrl: './project-page-header.component.css'
})
export class ProjectPageHeader implements OnInit {
  project!: Project
  numberOfCompletedTasks = 0
  numberOfTasks = 0

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.projectService.getProjectById(Number(id))
      .subscribe(value => {
        this.project = value
        this.getNumberOfTasks()
      })
  }

  toggleFavorite(project: Project) {
    project.favorite = !project.favorite
  }


  onTitleBlur(event: FocusEvent) {
    const value = (event.target as HTMLElement).innerText;

    if (value !== this.project.name) {
      console.log('Changed:', value);
      this.project.name = value
      this.projectService.updateProject(this.project)
        .subscribe({
          next: (response) => {
            console.log('Success', response);
          },
          error: (err) => {
            console.log('Request failed', err);
          }
        })
    }
  }

  private getNumberOfTasks() {
    this.taskService.getProjectNumberOfTasks(this.project.id)
      .subscribe(value => {
        this.numberOfTasks = value.valueOf()
        console.log(value)
      })
  }

  private getNumberOfCompltedTasks() {

  }
}
