import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './header/header.component'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent], 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'smartqurylys';
  currentRoute: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      let url = event.urlAfterRedirects.split('?')[0].split('#')[0];
      this.currentRoute = url === '' ? '/' : url;
    });
  }

  showAppHeader(): boolean {
    const noHeaderRoutes = ['/', '/home', '/login', '/register', '/forgot-password'];
    return !noHeaderRoutes.includes(this.currentRoute);
  }

  showProjectTabs(): boolean {
    return this.currentRoute.startsWith('/projects/') || this.currentRoute === '/create-project';
  }


  isDossierActive(): boolean {
    return this.currentRoute === '/create-project' || (this.currentRoute.startsWith('/projects/') && !this.currentRoute.includes('/participants') && !this.currentRoute.includes('/files'));
  }

  isParticipantsActive(): boolean {
    return this.currentRoute.includes('/projects/') && this.currentRoute.includes('/participants');
  }

  isFilesActive(): boolean {
    return this.currentRoute.includes('/projects/') && this.currentRoute.includes('/files');
  }
  
}
