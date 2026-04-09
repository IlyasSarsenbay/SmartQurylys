import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { auditTime, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityActionType, ActivityEntityType } from '../../core/enums/activity-log.enum';
import { ActivityLogResponse } from '../../core/models/activity-log';
import { Project } from '../../core/models/project';
import { ProjectRealtimeService } from '../../core/project-realtime.service';
import { ProjectService } from '../../core/project.service';
import { RichEditorComponent } from "../rich-editor/rich-editor.component";
import { ProjectDescCardComponent } from "../project-desc-card/project-desc-card.component";
import { ProjectFilesSectionComponent } from "../project-files-section/project-files-section.component";

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RichEditorComponent, ProjectDescCardComponent, ProjectFilesSectionComponent],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.css'
})
export class NewProjectDetailsComponent implements OnInit, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  project!: Project
  activityLog: ActivityLogResponse[] = [];
  private projectId: number | null = null;

  @ViewChild('descriptionWrapper')
  descriptionWrapper?: ElementRef<HTMLElement>;

  isDescriptionExpanded = false;
  isDescriptionCollapsible = false;
  isEditorEnabled = false;

  private readonly collapsedHeight = 120;


  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly projectService: ProjectService,
    private readonly projectRealtimeService: ProjectRealtimeService
  ) { }

  ngOnInit(): void {
    const projectId = Number(this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(projectId)) {
      this.projectId = projectId;
      this.fetchActivityLog();
    }

    this.projectService.activeProject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => {
        if (project) {
          this.project = project;
          this.isDescriptionExpanded = false;
          this.isDescriptionCollapsible = false;
          this.scheduleCollapsibleCheck();
        }
      });

    this.projectRealtimeService.events$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((event) => this.projectId !== null && event.projectId === this.projectId),
        auditTime(200)
      )
      .subscribe(() => {
        this.fetchActivityLog();
      });
  }

  ngAfterViewInit(): void {
    this.scheduleCollapsibleCheck();
  }


  updateProjectDescription(descriptionHTML: string) {
    this.project.description = descriptionHTML
    this.projectService.updateProject(this.project)
      .subscribe(value => {
        this.project = value
      })
  }

  toggleEditor() {
    this.isEditorEnabled = !this.isEditorEnabled
  }

  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  private checkCollapsible(): void {
    const wrapper = this.descriptionWrapper?.nativeElement;
    if (!wrapper) return;

    const fullHeight = wrapper.scrollHeight;

    this.isDescriptionCollapsible = fullHeight > this.collapsedHeight;

    if (!this.isDescriptionCollapsible) {
      this.isDescriptionExpanded = true;
    }
  }

  private scheduleCollapsibleCheck(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.checkCollapsible();
      });
    });
  }

  private fetchActivityLog(): void {
    if (this.projectId === null) {
      return;
    }

    this.http.get<ActivityLogResponse[]>(`${environment.apiUrl}/projects/${this.projectId}/activity-log`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (logs) => {
          this.activityLog = logs;
        },
        error: (error) => {
          console.error('Failed to load activity log:', error);
          this.activityLog = [];
        }
      });
  }

  getActivityActionText(type: string): string {
    switch (type as ActivityActionType) {
      case ActivityActionType.REQUEST_ACCEPTANCE:
        return 'запросил подтверждение выполнения';
      case ActivityActionType.ACCEPTED_ACCEPTANCE:
        return 'подтвердил выполнение';
      case ActivityActionType.REJECTED_ACCEPTANCE:
        return 'отклонил выполнение';
      case ActivityActionType.PROJECT_UPDATED:
        return 'обновил проект';
      case ActivityActionType.STAGE_UPDATED:
        return 'обновил этап';
      case ActivityActionType.STAGE_DELETED:
        return 'удалил этап';
      case ActivityActionType.FILE_ADDED:
        return 'добавил файл';
      case ActivityActionType.FILE_DELETED:
        return 'удалил файл';
      case ActivityActionType.DOCUMENT_ADDED:
        return 'добавил документ';
      case ActivityActionType.DOCUMENT_DELETED:
        return 'удалил документ';
      case ActivityActionType.PARTICIPANT_INVITED:
        return 'пригласил участника';
      case ActivityActionType.PARTICIPANT_JOINED:
        return 'добавился в проект';
      case ActivityActionType.PARTICIPANT_REMOVED:
        return 'удалил участника';
      default:
        return 'выполнил действие';
    }
  }

  getActivityEntityText(type: string): string {
    switch (type as ActivityEntityType) {
      case ActivityEntityType.STAGE:
        return 'в этапе';
      case ActivityEntityType.PARTICIPANT:
      case ActivityEntityType.DOCUMENT:
      case ActivityEntityType.PROJECT:
      case ActivityEntityType.FILE:
      default:
        return '';
    }
  }
}
