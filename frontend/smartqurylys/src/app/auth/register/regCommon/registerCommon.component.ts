import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router'; 

/**
 * Компонент для страницы выбора типа регистрации
 * @description Отображает карточки для выбора между регистрацией юридического или физического лица
 */
@Component({
  selector: 'app-registerCommon',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './registerCommon.component.html',
  styleUrls: ['./registerCommon.component.css']
})
export class RegisterCommonComponent {
  /**
   * Конструктор компонента
   * @param authService - сервис аутентификации
   * @param router - для навигации
   */
  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  /**
   * Выход из системы
   * Очищает данные аутентификации и перенаправляет на страницу входа
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}