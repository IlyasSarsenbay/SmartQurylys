import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectPageHeader } from "../project-page-header/project-page-header.component";
import { Project } from '../../core/models/project';
import { ProjectService } from '../../core/project.service';
import { RichEditorComponent } from "../rich-editor/rich-editor.component";
import { PROJECT_STATUS_RU } from '../../core/models/project';
import { NgClass } from '@angular/common';
import { ProjectDescCardComponent } from "../project-desc-card/project-desc-card.component";
import { ProjectFilesSectionComponent } from "../project-files-section/project-files-section.component";

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [FormsModule, ProjectPageHeader, FormsModule, RichEditorComponent, NgClass, ProjectDescCardComponent, ProjectFilesSectionComponent],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.css'
})
export class NewProjectDetailsComponent implements OnInit, AfterViewInit {

  project!: Project

  @ViewChild('descriptionWrapper')
  descriptionWrapper?: ElementRef<HTMLElement>;

  isDescriptionExpanded = false;
  isDescriptionCollapsible = false;
  isEditorEnabled = false;

  private readonly collapsedHeight = 120;


  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id")
    this.projectService.getProjectById(Number(id))
      .subscribe(value => {
        this.project = value
      })
  }

  ngAfterViewInit(): void {
    this.checkCollapsible();
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

    const wasExpanded = this.isDescriptionExpanded;

    this.isDescriptionExpanded = true;

    requestAnimationFrame(() => {
      const fullHeight = wrapper.scrollHeight;

      this.isDescriptionCollapsible = fullHeight > this.collapsedHeight;

      if (!this.isDescriptionCollapsible) {
        this.isDescriptionExpanded = true;
      } else {
        this.isDescriptionExpanded = wasExpanded;
      }
    });
  }
}
