import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { CityService } from '../../core/city.service';
import { City } from '../../core/models/city';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrganisationService } from '../../core/organisation.service';
import { OrganisationType } from '../../core/enums/organisation-type.enum';
import { Specialization } from '../../core/enums/specialisation.enum';
import { OrganisationUpdateRequest, OrganisationResponse } from '../../core/models/organisation';

@Component({
  selector: 'app-organisation-profile-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './organisation-profile-edit-modal.component.html',
  styleUrls: ['./organisation-profile-edit-modal.component.css']
})
export class OrganisationProfileEditModalComponent implements OnInit {
  @Input() organisation: OrganisationResponse | null = null; // Changed input to OrganisationResponse
  @Output() close = new EventEmitter<void>();
  @Output() organisationUpdated = new EventEmitter<OrganisationResponse>(); // Changed output type

  organisationEditForm!: FormGroup;
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
    private cityService: CityService,
    private organisationService: OrganisationService
  ) { }

  ngOnInit(): void {
    this.loadCities();
    if (this.organisation) {
      this.initForm(this.organisation);
    } else {
      this.errorMessage = 'Организация не найдена для редактирования.';
      this.initForm(null);
    }
  }

  initForm(organisationData: OrganisationResponse | null): void {
    if (organisationData) {
      this.organisationEditForm = this.fb.group({
        // User (Organisation Admin) fields
        fullName: [organisationData.fullName, Validators.required],
        phone: [organisationData.phone, [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
        iinBin: [organisationData.iinBin, [Validators.required, Validators.pattern(/^\d{12}$/)]],
        cityId: [organisationData.city ? (this.cities.find(c => c.name === organisationData?.city)?.id || null) : null, Validators.required],

        // Organisation fields
        judAddress: [organisationData.judAddress || '', Validators.required],
        organization: [organisationData.organization || '', Validators.required],
        position: [organisationData.position || '', Validators.required],
        type: [organisationData.type || null, Validators.required],
        field: [organisationData.field || '', Validators.required],
        yearsOfExperience: [organisationData.yearsOfExperience || null, [Validators.required, Validators.min(0)]],
      });

      const specializationFormGroup = new FormGroup({});
      this.specializationKeys.forEach(specKey => {
        const isChecked = organisationData.specialization?.includes(specKey);
        specializationFormGroup.addControl(specKey, new FormControl(isChecked));
      });
      this.organisationEditForm.addControl('specialization', specializationFormGroup);

      this.organisationEditForm.get('specialization')?.setValidators(
        (control: AbstractControl) => {
          const specializationGroup = control as FormGroup;
          const hasSelection = Object.values(specializationGroup.value).some(value => value);
          return hasSelection ? null : { required: true };
        }
      );
    } else {
      // Default form for new organization if data is not provided (shouldn't happen in edit context)
      this.organisationEditForm = this.fb.group({
        fullName: ['', Validators.required],
        phone: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
        iinBin: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
        cityId: [null, Validators.required],

        judAddress: ['', Validators.required],
        organization: ['', Validators.required],
        position: ['', Validators.required],
        type: [null, Validators.required],
        field: ['', Validators.required],
        yearsOfExperience: [null, [Validators.required, Validators.min(0)]],
      });
      const specializationFormGroup = new FormGroup({});
      this.specializationKeys.forEach(specKey => {
        specializationFormGroup.addControl(specKey, new FormControl(false));
      });
      this.organisationEditForm.addControl('specialization', specializationFormGroup);

      this.organisationEditForm.get('specialization')?.setValidators(
        (control: AbstractControl) => {
          const specializationGroup = control as FormGroup;
          const hasSelection = Object.values(specializationGroup.value).some(value => value);
          return hasSelection ? null : { required: true };
        }
      );
    }
  }

  loadCities(): void {
    this.cityService.getAllCities().pipe(
      catchError(error => {
        console.error('Error loading cities:', error);
        this.errorMessage = 'Не удалось загрузить список городов.';
        return of([]);
      })
    ).subscribe(cities => {
      this.cities = cities;
      if (this.organisation && !this.organisationEditForm.get('cityId')?.value && this.organisation.city) {
        const currentCity = cities.find(c => c.name === this.organisation?.city);
        if (currentCity) {
          this.organisationEditForm.get('cityId')?.setValue(currentCity.id);
        }
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.organisationEditForm.valid && this.organisation && this.organisation.id) {
      const formValue = this.organisationEditForm.value;
      
      const selectedSpecializations = this.specializationKeys
        .filter(key => formValue.specialization[key]);

      const request: OrganisationUpdateRequest = {
        fullName: formValue.fullName,
        email: this.organisation.email, // Use email from the OrganisationResponse
        phone: formValue.phone,
        iinBin: formValue.iinBin,
        cityId: formValue.cityId,
        judAddress: formValue.judAddress,
        organization: formValue.organization,
        position: formValue.position,
        type: formValue.type,
        field: formValue.field,
        specialization: selectedSpecializations,
        yearsOfExperience: formValue.yearsOfExperience,
      };

      this.organisationService.updateMyOrganisation(request).subscribe({
        next: (updatedOrganisationResponse) => {
          this.successMessage = 'Данные организации успешно обновлены!';
          this.organisationUpdated.emit(updatedOrganisationResponse); // Emit the updated OrganisationResponse
          setTimeout(() => this.onClose(), 2000);
        },
        error: (error) => {
          this.errorMessage = 'Ошибка при обновлении данных организации: ' + (error.error?.message || error.statusText);
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
    }
  }
}
