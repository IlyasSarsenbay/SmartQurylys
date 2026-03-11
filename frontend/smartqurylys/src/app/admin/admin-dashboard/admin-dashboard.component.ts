import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
/**
 * @description Компонент не требует использования OnInit, currentRoute
 * или пользовательского метода isLinkActive, так как все активные состояния
 * обрабатываются встроенной директивой routerLinkActive.
 * 
 * Конструктор оставлен пустым, но может быть расширен для внедрения
 * других сервисов при необходимости.
 */
}
