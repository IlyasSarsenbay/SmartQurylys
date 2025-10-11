import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from '././auth/register/register.component';
import { RegisterCommonComponent } from '././auth/register/regCommon/registerCommon.component';
import { RegisterOrgComponent } from '././auth/register/registerOrg/registerOrg.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { authGuard } from './auth/auth.guard';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component'; 
import { MyProjectsComponent } from './projects/my-projects/my-projects.component';
import { CreateProjectComponent } from './projects/create-project/create-project.component'; 
import { ProjectDetailsComponent } from './projects/project-details/project-details.component'; 
import { CreateStageComponent } from './projects/project-details/create-stage/create-stage.component'; // Добавлен импорт CreateStageComponent
import { ProjectDashboardComponent } from './project-dashboard/project-dashboard.component';
import { DocumentsComponent } from './project-dashboard/document/document.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registerUser', component: RegisterComponent },
  { path: 'projects/:id/documents', component: DocumentsComponent, canActivate: [authGuard] },
  { path: 'registerOrg', component: RegisterOrgComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'register', component: RegisterCommonComponent, canActivate: [authGuard] },
  { path: 'my-projects', component: MyProjectsComponent, canActivate: [authGuard] },
  { path: 'create-project', component: CreateProjectComponent, canActivate: [authGuard] }, 
  { path: 'schedules/:scheduleId/create-stage', component: CreateStageComponent, canActivate: [authGuard] },
  { path: 'project/:id', component: ProjectDetailsComponent, canActivate: [authGuard] }, 
  { path: 'projects/:id', component: ProjectDashboardComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
