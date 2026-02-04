import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganisationResponse } from '../../core/models/organisation';
import { OrganisationService } from '../../core/organisation.service';
import { Router } from '@angular/router'; // Import Router
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

  constructor(private organisationService: OrganisationService, private router: Router) { } // Inject Router

  ngOnInit(): void {
    this.loadOrganisations();
  }

  loadOrganisations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.organisationService.getAllOrganisations().pipe(
      catchError(error => {
        console.error('Error loading organisations:', error);
        this.errorMessage = 'Ошибка загрузки организаций.';
        this.loading = false;
        return of([]); // Return an empty array on error
      })
    ).subscribe(organisations => {
      this.organisations = organisations;
      this.loading = false;
    });
  }

  viewOrganisation(organisationId: number): void {
    console.log('Navigating to view organisation:', organisationId);
    this.router.navigate(['/admin/organisations/view', organisationId]); // Navigate to a placeholder view route
  }

  editOrganisation(organisationId: number): void {
    console.log('Navigating to edit organisation:', organisationId);
    this.router.navigate(['/admin/organisations/edit', organisationId]); // Navigate to a placeholder edit route
  }

  deleteOrganisation(organisationId: number): void {
    if (confirm('Вы уверены, что хотите удалить эту организацию?')) {
      this.organisationService.deleteOrganisation(organisationId).subscribe({
        next: () => {
          console.log('Organisation deleted:', organisationId);
          this.loadOrganisations(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting organisation:', error);
          this.errorMessage = 'Ошибка при удалении организации.';
        }
      });
    }
  }
}
