import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; // Нужен для *ngIf, *ngFor и т.д.
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Нужны для работы с формами
import { RouterModule } from '@angular/router'; // Нужен для routerLink

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from '././register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,         
    ReactiveFormsModule, 
    RouterModule        
  ],
  exports: [
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
  ]
})
export class AuthModule { }