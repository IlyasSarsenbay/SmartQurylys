import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; // Добавляем RouterModule
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule], // Важно: импортируем RouterModule для routerLink
  templateUrl: './home.component.html', // Указываем HTML-файл
  styleUrls: ['./home.component.css'] // Указываем CSS-файл
})
export class HomeComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Если пользователь аутентифицирован, перенаправляем на дашборд
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
    // Если не аутентифицирован, компонент просто отобразит свой HTML (лендинговую страницу)
  }
}
