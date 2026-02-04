import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserResponse } from '../../core/models/user';
import { RegisterRequest } from '../../core/models/auth';
import { CityService } from '../../core/city.service';
import { City } from '../../core/models/city';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '../../core/user.service';

@Component({
  selector: 'app-user-profile-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile-edit-modal.component.html',
  styleUrls: ['./user-profile-edit-modal.component.css']
})
export class UserProfileEditModalComponent implements OnInit {
  @Input() user: UserResponse | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() userUpdated = new EventEmitter<UserResponse>();

  userEditForm!: FormGroup;
  cities: City[] = [];
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private cityService: CityService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadCities();
    this.initForm();
  }

  initForm(): void {
    if (this.user) {
      const cityIdForForm = this.user.city ? (this.cities.find(c => c.name === this.user?.city)?.id || null) : null;
      this.userEditForm = this.fb.group({
        fullName: [this.user.fullName, Validators.required],
        email: [{value: this.user.email, disabled: true}, [Validators.required, Validators.email]],
        phone: [this.user.phone, [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
        iinBin: [this.user.iinBin, [Validators.required, Validators.pattern(/^\d{12}$/)]],
        cityId: [cityIdForForm, Validators.required],
        organization: [{value: this.user.organization, disabled: true}],
      });
    } else {
      this.userEditForm = this.fb.group({
        fullName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
        iinBin: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
        cityId: [null, Validators.required],
        organization: [''],
      });
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
      if (this.user && this.user.city && !this.userEditForm.get('cityId')?.value) {
        const currentCity = cities.find(c => c.name === this.user?.city);
        if (currentCity) {
          this.userEditForm.get('cityId')?.setValue(currentCity.id);
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
    if (this.userEditForm.valid && this.user) {
      const formValue = this.userEditForm.value;
      if (!formValue.cityId) {
        this.errorMessage = 'Город обязателен.';
        return;
      }

      const request: RegisterRequest = {
        fullName: formValue.fullName,
        email: this.user?.email || '', // email is disabled, so use existing user email
        phone: formValue.phone,
        password: formValue.password,
        iinBin: formValue.iinBin,
        cityId: formValue.cityId,
        organization: this.user?.organization || '' // organization is disabled, so use existing user organization
      };

      this.userService.updateCurrentUserProfile(request).subscribe({
        next: () => {
          this.successMessage = 'Данные пользователя успешно обновлены!';
          if (this.user) {
            this.user.fullName = request.fullName;
            this.user.email = this.user.email;
            this.user.phone = request.phone;
            this.user.iinBin = request.iinBin;
            const updatedCity = this.cities.find(c => c.id === request.cityId);
            if (updatedCity) {
              this.user.city = updatedCity.name;
            }
          }
          this.userUpdated.emit(this.user || undefined); // Emit the updated user object
          setTimeout(() => this.onClose(), 2000);
        },
        error: (error) => {
          console.error('Error updating user profile:', error);
          console.error('HTTP Status:', error.status);
          console.error('Error Status Text:', error.statusText);
          console.error('Backend Error Body (error.error):', error.error); // Added this line
          this.errorMessage = 'Ошибка при обновлении данных пользователя: ' + (error.error?.message || error.statusText || 'Неизвестная ошибка');
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
    }
  }
}