import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NewSideMenuComponent } from './NEW_COMPONENTS/new-side-menu/new-side-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NewSideMenuComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isPanelOpen = false
  private readonly hiddenRoutes = new Set([
    '/',
    '/login',
    '/register',
    '/registerOrg',
    '/registerUser',
    '/forgot-password'
  ]);

  constructor(private readonly router: Router) { }

  get hideSideMenu(): boolean {
    const normalizedUrl = this.router.url.split('?')[0].split('#')[0];
    return this.hiddenRoutes.has(normalizedUrl);
  }
}
