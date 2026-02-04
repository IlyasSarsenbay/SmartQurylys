import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatComponent],
  template: `
<div class="chat-page-layout">
  <div class="sidebar">
    <div class="sidebar-item" routerLink="/my-projects" routerLinkActive="active">
      <i class="fas fa-list-alt"></i>
      <span>Проекты</span>
    </div>
    <div class="sidebar-item" routerLink="/contractor-registry" routerLinkActive="active">
      <i class="fas fa-hard-hat"></i>
      <span>Найти Подрядчика</span>
    </div>
    <div class="sidebar-item" routerLink="/chat" routerLinkActive="active">
      <i class="fas fa-comments"></i>
      <span>Чат</span>
    </div>
  </div>

  <div class="main-content">
    <app-chat></app-chat>
  </div>
</div>
  `,
  styles: [`
.chat-page-layout {
  display: flex;
  height: 100vh;
  background-color: #f3f4f6;
}

.sidebar {
  width: 250px;
  background-color: #F8F8F8;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 15px 20px;
  margin: 0 10px 5px 10px;
  color: #2C3E50;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out, color 0.2s ease-in-out;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.sidebar-item:hover {
  background-color: #DDE5EC;
}

.sidebar-item.active {
  background-color: #283693;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.sidebar-item.active i {
  color: white;
}

.sidebar-item i {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
  color: #2C3E50;
}

.sidebar-item:not(.active) i {
  color: #2C3E50;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content app-chat {
  flex: 1;
  display: flex;
  height: 100%;
}
  `]
})
export class ChatPageComponent { }
