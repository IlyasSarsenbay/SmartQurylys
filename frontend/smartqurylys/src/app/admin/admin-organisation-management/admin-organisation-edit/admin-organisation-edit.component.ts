import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganisationService } from '../../../core/organisation.service';
import { CityService } from '../../../core/city.service';
import { City } from '../../../core/models/city';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { OrganisationResponse, OrganisationUpdateRequest } from '../../../core/models/organisation';
import { OrganisationType } from '../../../core/enums/organisation-type.enum';
import { Specialization } from '../../../core/enums/specialisation.enum';

@Component({
  selector: 'app-admin-organisation-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-organisation-edit.component.html',
  styleUrls: ['./admin-organisation-edit.component.css']
})
export class AdminOrganisationEditComponent implements OnInit {
  organisationId: number | null = null;
  organisationForm!: FormGroup;
  cities: City[] = [];
  errorMessage: string = '';
  successMessage: string = '';

  public organisationTypeOptions = Object.keys(OrganisationType).map(key => ({
    key,
    value: OrganisationType[key as keyof typeof OrganisationType]
  }));
  public specializationOptions = Object.keys(Specialization).map(key => ({
    key,
    value: Specialization[key as keyof typeof Specialization]
  }));
  public specializationKeys: string[] = Object.keys(Specialization);

  constructor(
    private fb: FormBuilder,
    private organisationService: OrganisationService,
    private cityService: CityService,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.organisationId = Number(params.get('id'));
      if (this.organisationId) {
        forkJoin({
          organisation: this.organisationService.getOrganisationById(this.organisationId),
          cities: this.cityService.getAllCities()
        }).subscribe({
          next: ({ organisation, cities }) => {
            this.initializeForm(organisation, cities);
          },
          error: (error) => {
            this.errorMessage = 'Ошибка загрузки данных организации: ' + (error.message || error.statusText);
            console.error('Error loading organisation data:', error);
          }
        });
      }
    });
  }

  initializeForm(organisation: OrganisationResponse, cities: City[]): void {
    const city = cities.find(c => c.name === organisation.city);
    this.organisationForm = this.fb.group({
      organization: [organisation.organization, Validators.required],
      iinBin: [organisation.iinBin, [Validators.required, Validators.pattern(/^\d{12}$/)]],
      judAddress: [organisation.judAddress, Validators.required],
      fullName: [organisation.fullName, Validators.required],
      position: [organisation.position, Validators.required],
      type: [organisation.type, Validators.required],
      yearsOfExperience: [organisation.yearsOfExperience, [Validators.required, Validators.min(0)]],
      cityId: [city ? city.id : null, Validators.required],
      email: [organisation.email, [Validators.required, Validators.email]],
      phone: [organisation.phone, [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
    });

    const specializationFormGroup = new FormGroup({});
    this.specializationKeys.forEach(specKey => {
      const isChecked = organisation.specialization.includes(specKey);
      specializationFormGroup.addControl(specKey, new FormControl(isChecked));
    });
    this.organisationForm.addControl('specialization', specializationFormGroup);

    this.organisationForm.get('specialization')?.setValidators(
      (control: AbstractControl) => {
        const specializationGroup = control as FormGroup;
        const hasSelection = Object.values(specializationGroup.value).some(value => value);
        return hasSelection ? null : { required: true };
      }
    );
  }

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.organisationForm.invalid) {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
      return;
    }

    if (this.organisationId) {
      const formValue = this.organisationForm.value;
      const selectedSpecializations = this.specializationKeys
        .filter(key => formValue.specialization[key]);

      const request: OrganisationUpdateRequest = {
        organization: formValue.organization,
        iinBin: formValue.iinBin,
        judAddress: formValue.judAddress,
        fullName: formValue.fullName,
        position: formValue.position,
        type: formValue.type,
        specialization: selectedSpecializations,
        yearsOfExperience: formValue.yearsOfExperience,
        cityId: formValue.cityId,
        email: formValue.email,
        phone: formValue.phone,
      };

      this.organisationService.updateOrganisation(this.organisationId, request).subscribe({
        next: (response) => {
          this.successMessage = 'Данные организации успешно обновлены!';
          setTimeout(() => {
            this.router.navigate(['/admin/organisation-management']);
          }, 2000);
        },
        error: (err) => {
          this.errorMessage = 'Ошибка обновления организации: ' + (err.error?.message || err.statusText);
        }
      });
    }
  }
}
