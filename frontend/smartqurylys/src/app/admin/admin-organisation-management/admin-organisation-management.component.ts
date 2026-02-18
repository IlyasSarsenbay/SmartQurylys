import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganisationResponse } from '../../core/models/organisation';
import { OrganisationService } from '../../core/organisation.service';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin-organisation-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-organisation-management.component.html',
  styleUrls: ['./admin-organisation-management.component.css']
})
export class AdminOrganisationManagementComponent implements OnInit {
  organisations: OrganisationResponse[] = [];
  loading: boolean = true;
  errorMessage: string = '';

  constructor(
    private organisationService: OrganisationService,
    private router: Router
  ) { }

  /**
   * @description Инициализация компонента. Загружает список организаций при создании компонента.
   */
  ngOnInit(): void {
    this.loadOrganisations();
  }

  /**
   * @description Загружает список всех организаций с сервера.
   * Управляет состояниями загрузки и ошибок.
   */
  loadOrganisations(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.organisationService.getAllOrganisations().pipe(
      catchError(error => {
        console.error('Error loading organisations:', error);
        this.errorMessage = 'Ошибка загрузки организаций.';
        this.loading = false;
        return of([]); // Возвращаем пустой массив при ошибке
      })
    ).subscribe(organisations => {
      this.organisations = organisations;
      this.loading = false;
    });
  }

  /**
   * @description Переход к странице просмотра деталей организации.
   * @param organisationId - ID организации для просмотра
   */
  viewOrganisation(organisationId: number): void {
    console.log('Navigating to view organisation:', organisationId);
    this.router.navigate(['/admin/organisations/view', organisationId]);
  }

  /**
   * @description Переход к странице редактирования организации.
   * @param organisationId - ID организации для редактирования
   */
  editOrganisation(organisationId: number): void {
    console.log('Navigating to edit organisation:', organisationId);
    this.router.navigate(['/admin/organisations/edit', organisationId]);
  }

  /**
   * @description Удаление организации после подтверждения пользователя.
   * @param organisationId - ID организации для удаления
   */
  deleteOrganisation(organisationId: number): void {
    if (confirm('Вы уверены, что хотите удалить эту организацию?')) {
      this.organisationService.deleteOrganisation(organisationId).subscribe({
        next: () => {
          console.log('Organisation deleted:', organisationId);
          this.loadOrganisations(); // Обновляем список после удаления
        },
        error: (error) => {
          console.error('Error deleting organisation:', error);
          this.errorMessage = 'Ошибка при удалении организации.';
        }
      });
    }
  }
}
