import { DatePipe, NgClass } from '@angular/common';
import { Component, HostListener, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CityService } from '../../core/city.service';
import { ProjectStatus } from '../../core/enums/project-status.enum';
import { City } from '../../core/models/city';
import { Project, PROJECT_STATUS_RU } from '../../core/models/project';
import { ProjectService } from '../../core/project.service';

type ProjectDateField = 'startDate' | 'endDate';

interface OverlayAnchorRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-project-desc-card',
  standalone: true,
  imports: [NgClass, DatePipe, FormsModule],
  templateUrl: './project-desc-card.component.html',
  styleUrl: './project-desc-card.component.css'
})
export class ProjectDescCardComponent implements OnInit {
  readonly PROJECT_STATUS_RU = PROJECT_STATUS_RU;
  readonly statusOptions: ProjectStatus[] = [
    ProjectStatus.DRAFT,
    ProjectStatus.WAITING,
    ProjectStatus.ACTIVE,
    ProjectStatus.ON_PAUSE,
    ProjectStatus.COMPLETED,
    ProjectStatus.CANCELLED
  ];

  @Input({ required: true }) project!: Project;
  @Input() canManageProject = false;

  cities: City[] = [];
  isStatusMenuOpen = false;
  isCityMenuOpen = false;
  activeDateField: ProjectDateField | null = null;
  activeDateValue = '';
  isTypeEditing = false;
  typeDraft = '';
  statusMenuTop = 0;
  statusMenuLeft = 0;
  cityMenuTop = 0;
  cityMenuLeft = 0;
  dateMenuTop = 0;
  dateMenuLeft = 0;

  constructor(
    private readonly projectService: ProjectService,
    private readonly cityService: CityService
  ) {}

  ngOnInit(): void {
    this.cityService.getAllCities().subscribe({
      next: (cities) => {
        this.cities = cities;
      },
      error: (error) => {
        console.error('Failed to load cities for project details card:', error);
      }
    });
  }

  toggleStatusMenu(anchorRect: OverlayAnchorRect): void {
    if (!this.canManageProject) {
      return;
    }

    this.isCityMenuOpen = false;
    this.activeDateField = null;

    if (this.isStatusMenuOpen) {
      this.isStatusMenuOpen = false;
      return;
    }

    this.isStatusMenuOpen = true;
    this.setOverlayPosition(anchorRect, 220, 300, (top, left) => {
      this.statusMenuTop = top;
      this.statusMenuLeft = left;
    });
  }

  changeStatus(newStatus: ProjectStatus): void {
    if (!this.canManageProject || this.project.status === newStatus) {
      this.isStatusMenuOpen = false;
      return;
    }

    this.persistProject({ status: newStatus });
    this.isStatusMenuOpen = false;
  }

  openDateMenu(field: ProjectDateField, anchorRect: OverlayAnchorRect): void {
    if (!this.canManageProject) {
      return;
    }

    this.isStatusMenuOpen = false;
    this.isCityMenuOpen = false;
    this.activeDateField = field;
    this.activeDateValue = this.toDateInputValue(this.project[field]);

    this.setOverlayPosition(anchorRect, 280, 160, (top, left) => {
      this.dateMenuTop = top;
      this.dateMenuLeft = left;
    });
  }

  saveDateField(): void {
    if (!this.canManageProject || !this.activeDateField || !this.activeDateValue) {
      this.activeDateField = null;
      return;
    }

    this.persistProject({ [this.activeDateField]: this.activeDateValue } as Partial<Project>);
    this.activeDateField = null;
  }

  cancelDateField(): void {
    this.activeDateField = null;
  }

  toggleCityMenu(anchorRect: OverlayAnchorRect): void {
    if (!this.canManageProject) {
      return;
    }

    this.isStatusMenuOpen = false;
    this.activeDateField = null;

    if (this.isCityMenuOpen) {
      this.isCityMenuOpen = false;
      return;
    }

    this.isCityMenuOpen = true;
    this.setOverlayPosition(anchorRect, 280, 320, (top, left) => {
      this.cityMenuTop = top;
      this.cityMenuLeft = left;
    });
  }

  selectCity(city: City): void {
    if (!this.canManageProject || this.project.cityId === city.id) {
      this.isCityMenuOpen = false;
      return;
    }

    this.persistProject({
      cityId: city.id,
      cityName: city.name
    });
    this.isCityMenuOpen = false;
  }

  startTypeEdit(): void {
    if (!this.canManageProject) {
      return;
    }

    this.typeDraft = this.project.type;
    this.isTypeEditing = true;

    setTimeout(() => {
      const input = document.getElementById('project-type-input') as HTMLInputElement | null;
      if (!input) {
        return;
      }

      input.focus();
      input.select();
    });
  }

  saveTypeEdit(): void {
    if (!this.canManageProject || !this.isTypeEditing) {
      return;
    }

    const nextType = this.typeDraft.trim();
    this.isTypeEditing = false;

    if (!nextType || nextType === this.project.type) {
      return;
    }

    this.persistProject({ type: nextType });
  }

  cancelTypeEdit(): void {
    this.isTypeEditing = false;
    this.typeDraft = '';
  }

  onTypeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveTypeEdit();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelTypeEdit();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.status-dropdown-wrapper') && !target?.closest('.project-card-overlay.status-overlay')) {
      this.isStatusMenuOpen = false;
    }

    if (!target?.closest('.city-dropdown-wrapper') && !target?.closest('.project-card-overlay.city-overlay')) {
      this.isCityMenuOpen = false;
    }

    if (!target?.closest('.date-dropdown-wrapper') && !target?.closest('.project-card-overlay.date-overlay')) {
      this.activeDateField = null;
    }
  }

  private persistProject(changes: Partial<Project>): void {
    const nextProject: Project = {
      ...this.project,
      ...changes
    };

    this.projectService.updateProject(nextProject).subscribe({
      next: (project) => {
        this.project = project;
      },
      error: (error) => {
        console.error('Failed to update project details card field:', error);
      }
    });
  }

  private setOverlayPosition(
    anchorRect: OverlayAnchorRect,
    menuWidth: number,
    menuHeight: number,
    apply: (top: number, left: number) => void
  ): void {
    const gutter = 12;
    const maxLeft = Math.max(gutter, window.innerWidth - menuWidth - gutter);
    const left = Math.min(Math.max(anchorRect.left, gutter), maxLeft);
    const preferredTop = anchorRect.bottom + 8;
    const maxTop = Math.max(gutter, window.innerHeight - menuHeight - gutter);
    const top = Math.min(Math.max(preferredTop, gutter), maxTop);

    apply(top, left);
  }

  private toDateInputValue(value: string): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 10);
  }
}
