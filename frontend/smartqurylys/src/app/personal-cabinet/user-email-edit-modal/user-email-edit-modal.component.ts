import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/user.service';
import { EmailVerificationService } from '../../core/email-verification.service';
import { UserResponse, ChangeEmailRequest } from '../../core/models/user';
import { SendEmailCodeRequest, VerifyEmailRequest } from '../../core/models/email-verification';

@Component({
  selector: 'app-user-email-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-email-edit-modal.component.html',
  styleUrls: ['./user-email-edit-modal.component.css']
})
export class UserEmailEditModalComponent implements OnInit {
  @Input() user: UserResponse | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() emailUpdated = new EventEmitter<string>();

  emailEditForm!: FormGroup;
  verificationForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  codeSent = false;
  
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private emailVerificationService: EmailVerificationService,
  ) { }

  ngOnInit(): void {
    this.emailEditForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
    });
    this.verificationForm = this.fb.group({
      code: ['', Validators.required],
    });
  }

  onClose(): void {
    this.close.emit();
  }

  sendVerificationCode(): void {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.emailEditForm.valid) {
      const request: SendEmailCodeRequest = {
        email: this.emailEditForm.value.newEmail,
      };
      this.emailVerificationService.sendEmailVerificationCode(request).subscribe({
        next: (response: string) => {
          this.successMessage = response || 'Код подтверждения отправлен на вашу новую почту.';
          this.codeSent = true;
        },
        error: (error) => {
          this.errorMessage = 'Ошибка при отправке кода: ' + (error.error?.message || error.statusText);
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, введите корректный email.';
    }
  }

  verifyCodeAndChangeEmail(): void {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.verificationForm.valid) {
      const verifyRequest: VerifyEmailRequest = {
        email: this.emailEditForm.value.newEmail,
        code: this.verificationForm.value.code,
      };
      this.emailVerificationService.verifyEmailVerificationCode(verifyRequest).subscribe({
        next: (response: string) => {
          if (response === 'Почта успешно подтверждена') {
            const changeEmailRequest: ChangeEmailRequest = {
              newEmail: this.emailEditForm.value.newEmail,
            };
            this.userService.changeEmail(changeEmailRequest).subscribe({
              next: (response: string) => {
                this.successMessage = response || 'Email успешно обновлен!';
                this.emailUpdated.emit(changeEmailRequest.newEmail);
                setTimeout(() => this.onClose(), 2000);
              },
              error: (error) => {
                this.errorMessage = 'Ошибка при обновлении email: ' + (error.error?.message || error.statusText);
              }
            });
          } else {
            this.errorMessage = 'Ошибка при проверке кода: ' + response;
          }
        },
        error: (error) => {
          this.errorMessage = 'Ошибка при проверке кода: ' + (error.error?.message || error.statusText);
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, введите код подтверждения.';
    }
  }

  onSubmit(): void {
    if (!this.codeSent) {
      this.sendVerificationCode();
    } else {
      this.verifyCodeAndChangeEmail();
    }
  }
}