import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentRoute: string = '';
  isAdmin: boolean = false;

  constructor(public router: Router, private authService: AuthService) { } // Changed to public

  ngOnInit(): void {
    const role = this.authService.getUserRole();
    this.isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.urlAfterRedirects.split('?')[0].split('#')[0];
    });
  }

  isLinkActive(route: string): boolean {
    // If the route is '/my-projects', activate it for /dashboard too.
    if (route === '/my-projects') { // Use /my-projects as that's the actual routerLink
      return this.router.url === '/dashboard' || this.router.url.startsWith('/my-projects');
    }
    return this.router.url.startsWith(route);
  }
}