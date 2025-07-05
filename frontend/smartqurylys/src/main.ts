import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser'; 
import { AppComponent } from './app/app.component'; 
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'; 
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { AuthInterceptor } from './app/core/interceptors/auth.interceptor'; 
import { importProvidersFrom } from '@angular/core'; 
import { AuthModule } from './app/auth/auth.module'; 
if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), 

    provideHttpClient(withInterceptors([AuthInterceptor])), 

    importProvidersFrom(AuthModule)
  ]
})
.catch(err => console.error(err));