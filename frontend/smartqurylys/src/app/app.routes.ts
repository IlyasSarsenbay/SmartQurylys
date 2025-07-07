import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { authGuard } from './auth/auth.guard';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component'; 
import { MyProjectsComponent } from './projects/my-projects/my-projects.component';
import { CreateProjectComponent } from './projects/create-project/create-project.component'; 
import { ProjectDetailsComponent } from './projects/project-details/project-details.component'; 

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'my-projects', component: MyProjectsComponent, canActivate: [authGuard] },
  { path: 'create-project', component: CreateProjectComponent, canActivate: [authGuard] }, 
  { path: 'projects/:id', component: ProjectDetailsComponent, canActivate: [authGuard] }, 
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
