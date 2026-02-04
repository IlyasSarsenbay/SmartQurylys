import { Component, EventEmitter, Output, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() notificationCount = 0;
  @Output() toggleNotifications = new EventEmitter<void>();

  constructor(private authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToPersonalCabinet(): void {
    this.router.navigate(['/personal-cabinet']);
  }

  onToggleNotifications() {
    this.toggleNotifications.emit();
  }
}
