import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/user.service';
import { UserResponse, ChangePasswordRequest } from '../../core/models/user';

@Component({
  selector: 'app-user-password-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-password-edit-modal.component.html',
  styleUrls: ['./user-password-edit-modal.component.css']
})
export class UserPasswordEditModalComponent implements OnInit {
  @Input() user: UserResponse | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() passwordUpdated = new EventEmitter<void>();

  passwordEditForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    this.passwordEditForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;
    return newPassword === confirmNewPassword ? null : { mismatch: true };
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.passwordEditForm.valid && this.user) {
      const formValue = this.passwordEditForm.value;
      
      const request: ChangePasswordRequest = {
        currentPassword: formValue.currentPassword,
        newPassword: formValue.newPassword,
      };

      this.userService.changePassword(request).subscribe({
        next: (response: string) => {
          this.successMessage = response || 'Пароль успешно обновлен!';
          this.passwordUpdated.emit();
          setTimeout(() => this.onClose(), 2000);
        },
        error: (error) => {
          this.errorMessage = 'Ошибка при обновлении пароля: ' + (error.error?.message || error.statusText);
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все поля корректно и убедитесь, что пароли совпадают.';
    }
  }
}