import { Component, Input, OnInit } from '@angular/core';
import { Project } from '../../core/models/project';
import { ProjectService } from '../../core/project.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/task.service';
import { ParticipantService } from '../../core/participant.service';
import { Participant } from '../../core/models/participant';

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
  isAccessDialogOpen = false;

  participants: Participant[] = []

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private participantService: ParticipantService
  ) { }

  ngOnInit(): void {
    this.projectService.activeProject$
      .subscribe((project) => {
        if (!project) {
          return;
        }

        this.project = project;
        this.getNumberOfTasks();
      });
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

  openDialog(): void {
    this.isAccessDialogOpen = true;

    this.participantService.getProjectParticipants(this.project.id)
      .subscribe((participants) => {
        this.participants = participants;
      });
  }

  closeDialog(): void {
    this.isAccessDialogOpen = false;
  }

  saveAccess(): void {
    this.closeDialog();
  }
}
