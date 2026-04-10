import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { Project } from '../../core/models/project';
import { ProjectService } from '../../core/project.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ParticipantService } from '../../core/participant.service';
import { Participant } from '../../core/models/participant';
import { ProjectRealtimeService } from '../../core/project-realtime.service';
import { UserService } from '../../core/user.service';
import { auditTime, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-project-header',
  standalone: true,
  imports: [RouterLink, FormsModule, RouterLinkActive],
  templateUrl: './project-page-header.component.html',
  styleUrl: './project-page-header.component.css'
})
export class ProjectPageHeader implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  project!: Project
  isAccessDialogOpen = false;
  currentUserIinBin: string | null = null;

  participants: Participant[] = []

  constructor(
    private projectService: ProjectService,
    private participantService: ParticipantService,
    private projectRealtimeService: ProjectRealtimeService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.projectService.activeProject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => {
        if (!project) {
          return;
        }

        this.project = project;
      });

    this.userService.getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUserIinBin = user.iinBin;
        },
        error: (error) => {
          console.error('Failed to load current user for project header:', error);
        }
      });

    this.projectRealtimeService.events$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((event) => !!this.project && event.projectId === this.project.id),
        auditTime(200)
      )
      .subscribe((event) => {
        if (event.type === 'PROJECT_UPDATED') {
          this.projectService.refreshProject(this.project.id).subscribe();
        }

        if (event.type.startsWith('PARTICIPANT_') && this.isAccessDialogOpen) {
          this.participantService.getProjectParticipants(this.project.id, true)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((participants) => {
              this.participants = participants;
            });
        }
      });
  }

  toggleFavorite(project: Project) {
    project.favorite = !project.favorite
  }

  get canEditProjectTitle(): boolean {
    return !!this.project && !!this.currentUserIinBin && this.project.ownerIinBin === this.currentUserIinBin;
  }

  onTitleBlur(event: FocusEvent) {
    if (!this.canEditProjectTitle) {
      return;
    }

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
