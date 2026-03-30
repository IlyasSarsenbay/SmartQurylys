import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from '././auth/register/register.component';
import { RegisterCommonComponent } from '././auth/register/regCommon/registerCommon.component';
import { RegisterOrgComponent } from '././auth/register/registerOrg/registerOrg.component';
import { authGuard } from './auth/auth.guard';
import { CreateProjectComponent } from './projects/create-project/create-project.component';
import { NewProjectDetailsComponent } from './NEW_COMPONENTS/project-details/new-project-details.component';
import { MyProjectsComponent } from './projects/my-projects/my-projects.component';
import { PersonalCabinetComponent } from './personal-cabinet/personal-cabinet.component';
import { ContractorRegistryComponent } from './contractor-registry/contractor-registry.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminUserManagementComponent } from './admin/admin-user-management/admin-user-management.component';
import { AdminUserDetailComponent } from './admin/admin-user-management/admin-user-detail/admin-user-detail.component';
import { AdminOrganisationManagementComponent } from './admin/admin-organisation-management/admin-organisation-management.component';
import { AdminOrganisationDetailComponent } from './admin/admin-organisation-management/admin-organisation-detail/admin-organisation-detail.component';
import { AdminProjectManagementComponent } from './admin/admin-project-management/admin-project-management.component';
import { AdminProjectDetailComponent } from './admin/admin-project-management/admin-project-detail/admin-project-detail.component';
import { ProjectDashboardComponent } from './project-dashboard/project-dashboard.component'
import { ChatComponent } from './chat/chat.component';
import { DocumentsComponent } from './project-dashboard/document/document.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ProjectDetailsComponent } from './projects/project-details/project-details.component';
import { NotificationModalComponent } from './notification-modal/notification-modal.component';
import { ProjectTasksPageComponent } from './NEW_COMPONENTS/project-tasks-page/project-tasks-page.component';
import { ProjectParticipantsComponent } from './NEW_COMPONENTS/project-participants/project-participants.component';
// Определение маршрутов приложения Angular.
export const routes: Routes = [
  { path: '', component: HomeComponent }, // Главная страница.
  { path: 'login', component: LoginComponent }, // Страница входа.
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'register', component: RegisterCommonComponent }, // Страница регистрации.
  { path: 'registerOrg', component: RegisterOrgComponent },
  { path: 'registerUser', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard], // Assuming authGuard is sufficient or AdminGuard
    children: [
      { path: '', component: AdminUserManagementComponent, pathMatch: 'full' },
      { path: 'users', component: AdminUserManagementComponent },
      { path: 'users/view/:id', component: AdminUserDetailComponent },
      { path: 'organisations', component: AdminOrganisationManagementComponent },
      { path: 'organisations/view/:id', component: AdminOrganisationDetailComponent },
      { path: 'projects', component: AdminProjectManagementComponent },
      { path: 'projects/view/:id', component: AdminProjectDetailComponent },
      { path: '**', redirectTo: 'users' }
    ]
  },
  { path: 'personal-cabinet', component: PersonalCabinetComponent, canActivate: [authGuard] }, // Личный кабинет, требует аутентификации.
  { path: 'projects', component: MyProjectsComponent, canActivate: [authGuard] }, // Список моих проектов, требует аутентификации.
  { path: 'projects/create', component: CreateProjectComponent, canActivate: [authGuard] }, // Создание нового проекта, требует аутентификации.

  { path: 'projects/:id', component: NewProjectDetailsComponent, canActivate: [authGuard] },
  { path: 'projects/:id/tasks', component: ProjectTasksPageComponent, canActivate: [authGuard] },
  { path: 'projects/:id/documents', component: DocumentsComponent, canActivate: [authGuard] },
  { path: 'projects/:id/participants', component: ProjectParticipantsComponent, canActivate: [authGuard] },
  { path: 'contractor-registry', component: ContractorRegistryComponent, canActivate: [authGuard] }, // Реестр подрядчиков, требует аутентификации.
  
  //  old front
   { path: 'legacy/project/:id', component: ProjectDetailsComponent, canActivate: [authGuard] },
   { path: 'legacy/projects/:id', component: ProjectDashboardComponent, canActivate: [authGuard] },
   { path: 'notifications', component: NotificationModalComponent, canActivate: [authGuard] },
  

  { path: '**', redirectTo: '' } // Перенаправление на главную страницу для всех неизвестных маршрутов.

];