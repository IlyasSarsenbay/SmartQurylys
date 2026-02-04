import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganisationService } from '../core/organisation.service';
import { OrganisationResponse } from '../core/models/organisation';
import { Specialization } from '../core/enums/specialisation.enum';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { FileReviewStatus } from '../core/enums/file-review-status.enum';

@Component({
  selector: 'app-contractor-registry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contractor-registry.component.html',
  styleUrls: ['./contractor-registry.component.css']
})
export class ContractorRegistryComponent implements OnInit {
  organisations: OrganisationResponse[] = [];
  filteredOrganisations: OrganisationResponse[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  // Фильтры
  searchTerm: string = '';
  selectedCity: string = '';
  selectedSpecialization: string = '';
  selectedExperience: string = '';
  onlyWithApprovedLicenses: boolean = false;

  // Уникальные значения для фильтров
  cities: string[] = [];
  specializations: string[] = [];
  experienceRanges: string[] = ['Менее 1 года', '1-3 года', '3-5 лет', '5-10 лет', 'Более 10 лет'];

  constructor(private organisationService: OrganisationService) { }

  ngOnInit(): void {
    this.loadContractors();
  }

  loadContractors(): void {
    this.loading = true;

    // Пробуем получить подрядчиков через публичный endpoint
    this.organisationService.getAllOrganisations().subscribe({
      next: (data) => {
        this.processContractorsData(data);
      },
      error: (error) => {
        console.log('Public endpoint not available, trying alternative...');
        this.loadContractorsAlternative();
      }
    });
  }

  private loadContractorsAlternative(): void {
    this.organisationService.getContractorsFromAll().subscribe({
      next: (data) => {
        this.processContractorsData(data);
      },
      error: (error) => {
        this.organisationService.searchContractors({}).subscribe({
          next: (data) => {
            this.processContractorsData(data);
          },
          error: (err) => {
            this.errorMessage = 'Не удалось загрузить данные подрядчиков';
            this.loading = false;
            console.error('All methods failed:', err);
          }
        });
      }
    });
  }

  private processContractorsData(data: OrganisationResponse[]): void {
    if (data.length === 0) {
      this.organisations = [];
      this.filteredOrganisations = [];
      this.loading = false;
      return;
    }
    this.organisations = data;
    this.filteredOrganisations = data;
    this.extractFilterValues();
    this.loading = false;
  }

  getLicenseTypes(org: OrganisationResponse): string {
    if (org.licenses && org.licenses.length > 0) {
      const approvedLicenses = org.licenses.filter(license => license.reviewStatus === 'APPROVED');

      if (approvedLicenses.length > 0) {
        const licenseCategories = approvedLicenses
          .map(license => license.licenseCategoryDisplay)
          .filter(Boolean)
          .join(', ');
        return licenseCategories || 'Категория не указана';
      }
      return 'Лицензия не одобрена';
    }
    return 'Лицензия отсутствует';
  }

  extractFilterValues(): void {
    this.cities = [...new Set(this.organisations
      .filter(org => org.city)
      .map(org => org.city))].sort();

    const allSpecializations = this.organisations
      .flatMap(org => org.specialization || [])
      .map(spec => (Specialization as any)[spec] || spec);
    this.specializations = [...new Set(allSpecializations)].sort();
  }

  applyFilters(): void {
    this.filteredOrganisations = this.organisations.filter(org => {
      const matchesSearch = !this.searchTerm ||
        org.organization.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        org.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        org.field.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCity = !this.selectedCity || org.city === this.selectedCity;

      const matchesSpecialization = !this.selectedSpecialization ||
        (org.specialization && org.specialization.some(spec => (Specialization as any)[spec] === this.selectedSpecialization));

      const matchesExperience = this.matchesExperienceRange(org.yearsOfExperience);

      const matchesLicense = !this.onlyWithApprovedLicenses || this.hasApprovedLicense(org);

      return matchesSearch && matchesCity && matchesSpecialization && matchesExperience && matchesLicense;
    });
  }

  hasApprovedLicense(org: OrganisationResponse): boolean {
    return org.licenses?.some(license => license.reviewStatus === 'APPROVED') || false;
  }

  matchesExperienceRange(experience: number): boolean {
    if (!this.selectedExperience) return true;

    switch (this.selectedExperience) {
      case 'Менее 1 года': return experience < 1;
      case '1-3 года': return experience >= 1 && experience <= 3;
      case '3-5 лет': return experience > 3 && experience <= 5;
      case '5-10 лет': return experience > 5 && experience <= 10;
      case 'Более 10 лет': return experience > 10;
      default: return true;
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCity = '';
    this.selectedSpecialization = '';
    this.selectedExperience = '';
    this.onlyWithApprovedLicenses = false;
    this.filteredOrganisations = this.organisations;
  }

  getWorkTypes(org: OrganisationResponse): string {
    return org.specialization?.map(spec => (Specialization as any)[spec] || spec).join(', ') || 'Не указано';
  }
}