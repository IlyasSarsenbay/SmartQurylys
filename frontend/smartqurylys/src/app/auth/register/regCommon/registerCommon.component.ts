import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-registerCommon',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './registerCommon.component.html',
  styleUrls: ['./registerCommon.component.css']
})
export class RegisterCommonComponent {
  constructor(private authService: AuthService, private router: Router) {}
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}