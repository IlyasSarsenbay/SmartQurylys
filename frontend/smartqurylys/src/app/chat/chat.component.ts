import { Component, OnInit, OnDestroy, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ChatService } from '../core/chat.service';
import { ConversationResponse, ChatMessageResponse } from '../core/models/chat';
import { UserResponse } from '../core/models/user';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div [class.dashboard-layout]="isStandalone" class="full-height-container">
  <div class="sidebar" *ngIf="isStandalone">
    <div class="sidebar-item" routerLink="/my-projects" [class.active]="router.url === '/dashboard' || router.url.startsWith('/my-projects')">
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

  <div [class.main-content]="isStandalone" [class.embedded-content]="!isStandalone" class="full-height-container">
    <div class="chat-container">
      <div class="chat-sidebar">
        <div class="search-box">
          <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()" 
                 placeholder="Поиск..." class="search-input">
          
          <div *ngIf="showSearchResults" class="search-results">
            <div *ngFor="let user of searchResults" (click)="startPrivateChat(user)" class="search-result-item">
              <div class="avatar">{{ user.fullName?.charAt(0) || 'U' }}</div>
              <span>{{ user.fullName }}</span>
            </div>
            <div *ngIf="searchResults.length === 0" class="no-results">Пользователи не найдены</div>
          </div>
        </div>
        
        <div class="conversations-list">
          <div *ngFor="let conv of conversations" (click)="selectConversation(conv)"
               [class.active]="selectedConversation?.id === conv.id"
               class="conversation-item">
            <div class="conv-avatar" [class.project]="conv.type === 'PROJECT_CHAT'">
              <span *ngIf="conv.type === 'PROJECT_CHAT'">P</span>
              <span *ngIf="conv.type === 'PRIVATE_CHAT'">{{ conv.name?.charAt(0) || 'C' }}</span>
            </div>
            <div class="conv-info">
              <p class="conv-name">{{ conv.name }}</p>
              <p class="conv-preview">{{ conv.lastMessageContent || 'Нет сообщений' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-main" *ngIf="selectedConversation; else selectChatPlaceholder">
        <div class="chat-header">
          <div class="header-info">
            <div class="header-avatar">{{ selectedConversation.name?.charAt(0) || 'C' }}</div>
            <div>
              <h2>{{ selectedConversation.name }}</h2>
              <p class="participants">{{ getParticipantNames() }}</p>
            </div>
          </div>
          <div class="header-actions">
            <button (click)="openActionRegistry()" class="icon-btn" title="Реестр действий">
              <span>📋</span>
            </button>
          </div>
        </div>

        <div #messageContainer class="messages-area">
          <ng-container *ngFor="let msg of messages">
          <div *ngIf="msg.messageType !== 'ACKNOWLEDGEMENT_RESPONSE'" class="message-wrapper">
            <div class="message-avatar">{{ msg.sender?.fullName?.charAt(0) || 'U' }}</div>
            <div class="message-content">
              <div class="message-bubble" 
                   [class.special]="msg.messageType !== 'TEXT'"
                   [class.acknowledged]="msg.messageType === 'ACKNOWLEDGEMENT_RESPONSE'">
                <span class="sender-name">{{ msg.sender?.fullName }}</span>
                <p>{{ msg.content }}</p>
                
                <div *ngIf="msg.messageType === 'COORDINATION_REQUEST'" class="message-badge coordination">
                  📋 На согласование
                  <ng-container *ngIf="!isMessageSender(msg) && !hasRespondedToCoordination(msg)">
                    <button (click)="sendCoordinationResponse(msg, 'APPROVED')" class="ack-btn approve-btn">Принять</button>
                    <button (click)="sendCoordinationResponse(msg, 'REJECTED')" class="ack-btn reject-btn">Отклонить</button>
                  </ng-container>
                  <div *ngIf="hasRespondedToCoordination(msg)" class="acknowledged-badge-inline">
                    ✓ {{ getCoordinationResponseStatus(msg) === 'APPROVED' ? 'Согласовано' : 'Отклонено' }}
                  </div>
                </div>
                <div *ngIf="msg.messageType === 'ACKNOWLEDGEMENT_REQUEST'" class="message-badge acknowledgement">
                  👁️ На ознакомление
                  <button *ngIf="!isMessageSender(msg) && !hasAcknowledged(msg)" 
                          (click)="sendAcknowledgment(msg)" 
                          class="ack-btn">
                    Ознакомлен
                  </button>
                  <div *ngIf="hasAcknowledged(msg)" class="acknowledged-badge-inline">
                    ✓ Ознакомлен
                  </div>
                </div>
                
                <div *ngIf="msg.attachedFile" class="file-attachment">
                  <span class="file-icon">📎</span>
                  <a href="javascript:void(0)" 
                     (click)="downloadFile(msg.attachedFile)"
                     class="file-link">
                    {{ msg.attachedFile.name }}
                  </a>
                  <span class="file-size">({{ formatFileSize(msg.attachedFile.size) }})</span>
                </div>
                
                <span class="timestamp">{{ msg.timestamp | date:'HH:mm' }}</span>
              </div>
            </div>
          </div>
          </ng-container>
        </div>

        <div class="chat-input-area">
          <div class="action-menu-container">
            <button (click)="toggleActionMenu()" class="action-trigger" title="Действия">
              ⋯
            </button>
            <div *ngIf="showActionMenu" class="action-menu">
              <button (click)="setMessageType('COORDINATION_REQUEST')" class="action-item">📋 На согласование</button>
              <button (click)="setMessageType('ACKNOWLEDGEMENT_REQUEST')" class="action-item">👁️ На ознакомление</button>
              <button (click)="triggerFileInput()" class="action-item">📎 Прикрепить файл</button>
              <button (click)="showMentionMenu = true; showActionMenu = false" class="action-item">&#64; Упомянуть</button>
            </div>
          </div>

          <div *ngIf="showMentionMenu" class="mention-menu">
            <div class="mention-header">
              <span>Выберите участника:</span>
              <button (click)="showMentionMenu = false" class="close-small">×</button>
            </div>
            <div *ngFor="let participant of availableParticipantsForMention" 
                 (click)="mentionUser(participant)" 
                 class="mention-item-list">
              <div class="avatar-small">{{ participant.fullName?.charAt(0) }}</div>
              <span>{{ participant.fullName }}</span>
            </div>
          </div>

          <input type="file" #fileInput (change)="onFileSelected($event)" class="file-input">
          
          <div class="input-status-banner">
            <div *ngIf="selectedFile" class="selected-file-badge">
              📎 {{ selectedFile.name }}
              <button (click)="clearFile()" class="clear-badge-btn">×</button>
            </div>
            <div *ngIf="currentMessageType !== 'TEXT'" class="message-type-badge-input">
              {{ currentMessageType === 'COORDINATION_REQUEST' ? '📋 Согласование' : '👁️ Ознакомление' }}
              <button (click)="setMessageType('TEXT')" class="clear-badge-btn">×</button>
            </div>
          </div>

          <div class="input-row">
            <input type="text" [(ngModel)]="newMessageContent" (keyup.enter)="sendMessage()" 
                   placeholder="Введите сообщение" class="message-input-field">
            <button (click)="sendMessage()" [disabled]="!canSend()" class="send-message-btn">
              Отправить
            </button>
          </div>
        </div>
      </div>

      <ng-template #selectChatPlaceholder>
        <div class="placeholder-area">
          <p>Выберите беседу, чтобы начать общение</p>
        </div>
      </ng-template>

      <!-- Action Registry Modal -->
      <div *ngIf="isActionRegistryOpen" class="modal-overlay" (click)="closeActionRegistry()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>РЕЕСТР ДЕЙСТВИЙ</h2>
            <button (click)="closeActionRegistry()" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div *ngFor="let group of groupedActionMessages" class="action-group">
              <h3>{{ group.date }}</h3>
              <div *ngFor="let msg of group.actions" class="action-item-reg">
                <span class="action-org">{{ msg.sender?.organization || msg.sender?.fullName }}</span>
                <span class="action-text">{{ getActionText(msg) }}</span>
                <span class="action-time">{{ msg.timestamp | date:'HH:mm' }}</span>
              </div>
            </div>
            <div *ngIf="groupedActionMessages.length === 0" class="no-actions">
              Реестр действий пуст
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
  styles: [`
:host {
  display: block;
  width: 100%;
  height: 100%;
}

.full-height-container {
  height: 100%;
  width: 100%;
}

.dashboard-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background-color: var(--color-background-light);
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border-light);
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  margin-bottom: 5px;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-primary-dark);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
}

.sidebar-item:hover {
  background-color: #DDE5EC;
}

.sidebar-item.active {
  background-color: #283693;
  color: white;
  font-weight: 600;
}

.sidebar-item i {
  margin-right: 10px;
  font-size: 1.2rem;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #f5f5f5;
}

.embedded-content {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.chat-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: white;
}

.chat-sidebar {
  width: 300px;
  background: #fdfdfd;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #eee;
}

.search-box {
  padding: 1rem;
  position: relative;
}

.search-input {
  width: 100%;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  outline: none;
}

.search-results {
  position: absolute;
  z-index: 100;
  width: calc(100% - 2rem);
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 5px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.search-result-item {
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #374151;
}

.search-result-item:hover {
  background: #f5f5f5;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #5B89F7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #5B89F7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
  flex-shrink: 0;
}

.no-results {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-style: italic;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.conversation-item:hover {
  background: #f9fafb;
}

.conversation-item.active {
  background: #f3f4f6;
}

.conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #2C3E50;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.conv-avatar.project {
  background: #5B89F7;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-name {
  color: #1f2937;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-preview {
  color: #6b7280;
  font-size: 12px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: white;
}

.chat-header {
  height: 64px;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  border-bottom: 1px solid #eee;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #283693;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.chat-header h2 {
  color: #1f2937;
  font-size: 1rem;
  font-weight: bold;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participants {
  color: #6b7280;
  font-size: 12px;
  margin: 0.25rem 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 1.25rem;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #f5f5f5;
}

.message-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #5B89F7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-bubble {
  background: white;
  border-radius: 8px;
  padding: 0.75rem;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.message-bubble.special {
  border-left: 4px solid #2563eb;
}

.message-bubble.acknowledged {
  border-left: 4px solid #10b981;
  background: #f0fdf4;
}

.sender-name {
  color: #2563eb;
  font-weight: bold;
  font-size: 14px;
  display: block;
  margin-bottom: 0.25rem;
}

.message-bubble p {
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  word-wrap: break-word;
}

.message-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-top: 0.5rem;
}

.message-badge.coordination {
  background: #dbeafe;
  color: #1e40af;
}

.message-badge.acknowledgement {
  background: #fef3c7;
  color: #92400e;
}

.acknowledged-badge-inline {
  color: #10b981;
  font-size: 11px;
  font-weight: 600;
  margin-top: 5px;
}

.ack-btn {
  background: #059669;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
  margin-left: 8px;
}

.ack-btn:hover {
  background: #047857;
}

.file-attachment {
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  font-size: 13px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-icon {
  font-size: 16px;
}

.file-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.file-link:hover {
  text-decoration: underline;
}

.file-size {
  color: #9ca3af;
  font-size: 11px;
}

.timestamp {
  position: absolute;
  bottom: 4px;
  right: 8px;
  font-size: 10px;
  color: #9ca3af;
}

.chat-input-area {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.action-menu-container {
  position: relative;
  align-self: flex-start;
}

.action-trigger {
  background: #eee;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}

.action-trigger:hover {
  background: #ddd;
  color: #333;
}

.action-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 220px;
  z-index: 100;
  overflow: hidden;
}

.action-item {
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background 0.2s;
}

.action-item:hover {
  background: #f3f4f6;
}

.mention-menu {
  position: absolute;
  bottom: 100%;
  left: 50px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  width: 300px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 110;
}

.mention-header {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #374151;
}

.close-small {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
  line-height: 1;
}

.mention-item-list {
  padding: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: background 0.2s;
  color: #374151;
}

.mention-item-list:hover {
  background: #f3f4f6;
}

.file-input {
  display: none;
}

.input-status-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-file-badge {
  background: #4b5563;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.message-type-badge-input {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.clear-badge-btn {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.input-row {
  display: flex;
  gap: 0.75rem;
}

.message-input-field {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  color: #374151;
}

.message-input-field:focus {
  border-color: #2563eb;
}

.send-message-btn {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.send-message-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.send-message-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.placeholder-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 1.2rem;
  background: white;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #2563eb;
}

.modal-header h2 {
  margin: 0;
  color: #1e40af;
  font-size: 1.5rem;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  line-height: 1;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.action-group {
  margin-bottom: 2rem;
}

.action-group h3 {
  color: #1e40af;
  border-bottom: 1px solid #dbeafe;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.action-item-reg {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.action-org {
  background: #1e40af;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
}

.action-text {
  flex: 1;
  color: #374151;
}

.action-time {
  color: #9ca3af;
  font-size: 13px;
}

.no-actions {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
  font-style: italic;
}
    `]
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() initialProjectId?: number;
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('fileInput') private fileInputRef!: ElementRef;

  conversations: ConversationResponse[] = [];
  selectedConversation?: ConversationResponse;
  messages: ChatMessageResponse[] = [];
  newMessageContent: string = '';

  searchQuery: string = '';
  searchResults: UserResponse[] = [];
  showSearchResults: boolean = false;

  showActionMenu = false;
  showMentionMenu = false;
  selectedFile: File | null = null;
  currentMessageType: string = 'TEXT';

  isActionRegistryOpen = false;
  groupedActionMessages: { date: string, actions: ChatMessageResponse[] }[] = [];

  private pollingSubscription?: Subscription;
  public currentUserId?: number;
  private mentionedUserIds: number[] = [];
  public isStandalone: boolean = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.isStandalone = this.router.url.includes('/chat') && !this.initialProjectId;
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user.id;
        this.loadConversations();
        this.startPolling();
      },
      error: (err) => {
        console.error('Error loading current user:', err);
        this.loadConversations();
        this.startPolling();
      }
    });
  }

  startPolling() {
    this.pollingSubscription = interval(3000).subscribe(() => {
      if (this.selectedConversation) {
        this.loadMessageHistory(this.selectedConversation.id, false);
      }
    });
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
  }

  loadConversations() {
    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;

        if (this.initialProjectId) {
          const projectChat = conversations.find(c => c.projectId === this.initialProjectId);
          if (projectChat) {
            this.selectConversation(projectChat);
          } else {
            this.chatService.getOrCreateProjectConversation(this.initialProjectId).subscribe(chat => {
              this.conversations.unshift(chat);
              this.selectConversation(chat);
            });
          }
        } else {
          this.route.queryParams.subscribe(params => {
            if (params['conversationId']) {
              const convId = +params['conversationId'];
              const found = this.conversations.find(c => c.id === convId);
              if (found) {
                this.selectConversation(found);
              } else if (conversations.length > 0 && !this.selectedConversation) {
                this.selectConversation(conversations[0]);
              }
            } else if (conversations.length > 0 && !this.selectedConversation) {
              this.selectConversation(conversations[0]);
            }
          });
        }
      },
      error: (err) => console.error('Error loading conversations:', err)
    });
  }

  selectConversation(conv: ConversationResponse) {
    this.selectedConversation = conv;
    this.loadMessageHistory(conv.id, true);

    // Delete mention notifications for this conversation
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        const mentionNotifications = notifications.filter(n =>
          n.type === 'MENTION' &&
          n.relatedEntityId === conv.id &&
          !n.isRead
        );

        if (mentionNotifications.length > 0) {
          mentionNotifications.forEach(n => {
            this.notificationService.deleteNotification(n.id).subscribe({
              next: () => console.log(`Deleted mention notification ${n.id}`),
              error: (err) => console.error('Error deleting notification:', err)
            });
          });
        }
      },
      error: (err) => console.error('Error fetching notifications:', err)
    });
  }

  loadMessageHistory(id: number, scrollToBottom: boolean) {
    this.chatService.getMessageHistory(id).subscribe({
      next: (messages) => {
        const hadNewMessages = messages.length > this.messages.length;
        this.messages = messages;
        this.updateActionRegistry();
        if (scrollToBottom || hadNewMessages) {
          setTimeout(() => this.scrollToBottom(), 100);
        }
      },
      error: (err) => console.error('Error loading messages:', err)
    });
  }

  sendMessage() {
    if (!this.selectedConversation || !this.canSend()) return;

    this.chatService.sendMessage(
      this.selectedConversation.id,
      this.newMessageContent,
      this.currentMessageType,
      this.selectedFile || undefined,
      this.mentionedUserIds
    ).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.newMessageContent = '';
        this.mentionedUserIds = [];
        this.selectedFile = null;
        this.currentMessageType = 'TEXT';
        this.updateActionRegistry();
        setTimeout(() => this.scrollToBottom(), 100);
        // Note: Backend ChatMessageService already creates mention notifications
      },
      error: (err) => console.error('Error sending message:', err)
    });
  }

  sendAcknowledgment(parentMessage: ChatMessageResponse) {
    if (!this.selectedConversation) return;

    this.chatService.sendAcknowledgmentResponse(
      parentMessage.id,
      this.selectedConversation.id
    ).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.updateActionRegistry();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => console.error('Error sending acknowledgment:', err)
    });
  }

  sendCoordinationResponse(parentMessage: ChatMessageResponse, status: 'APPROVED' | 'REJECTED') {
    if (!this.selectedConversation) return;

    const content = status === 'APPROVED' ? 'Согласовано' : 'Отклонено';

    this.chatService.sendMessage(
      this.selectedConversation.id,
      content,
      'COORDINATION_RESPONSE',
      undefined,
      [],
      parentMessage.id,
      { status: status }
    ).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.updateActionRegistry();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => console.error('Error sending coordination response:', err)
    });
  }

  hasRespondedToCoordination(msg: ChatMessageResponse): boolean {
    return this.messages.some(m =>
      m.messageType === 'COORDINATION_RESPONSE' &&
      m.relatedMessageId === msg.id &&
      m.sender?.id === this.currentUserId
    );
  }

  getCoordinationResponseStatus(msg: ChatMessageResponse): string | null {
    const response = this.messages.find(m =>
      m.messageType === 'COORDINATION_RESPONSE' &&
      m.relatedMessageId === msg.id &&
      m.sender?.id === this.currentUserId
    );
    return response?.metaData?.['status'] || null;
  }

  onSearch() {
    if (this.searchQuery.length < 2) {
      this.showSearchResults = false;
      this.searchResults = [];
      return;
    }
    this.chatService.searchUsers(this.searchQuery).subscribe({
      next: (users) => {
        this.searchResults = users;
        this.showSearchResults = true;
      },
      error: (err) => console.error('Error searching users:', err)
    });
  }

  startPrivateChat(user: UserResponse) {
    this.chatService.getOrCreatePrivateConversation(user.id).subscribe({
      next: (chat) => {
        if (!this.conversations.find(c => c.id === chat.id)) {
          this.conversations.unshift(chat);
        }
        this.selectConversation(chat);
        this.showSearchResults = false;
        this.searchQuery = '';
        this.searchResults = [];
      },
      error: (err) => console.error('Error starting private chat:', err)
    });
  }

  toggleActionMenu() {
    this.showActionMenu = !this.showActionMenu;
  }

  setMessageType(type: string) {
    this.currentMessageType = type;
    this.showActionMenu = false;
  }

  mentionUser(user: UserResponse) {
    this.newMessageContent += `@${user.fullName} `;
    if (!this.mentionedUserIds.includes(user.id)) {
      this.mentionedUserIds.push(user.id);
    }
    this.showMentionMenu = false;
  }

  triggerFileInput() {
    this.fileInputRef.nativeElement.click();
    this.showActionMenu = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  clearFile() {
    this.selectedFile = null;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  canSend(): boolean {
    return this.newMessageContent.trim().length > 0 || this.selectedFile !== null;
  }

  isMessageSender(msg: ChatMessageResponse): boolean {
    return msg.sender?.id === this.currentUserId;
  }

  hasAcknowledged(parentMessage: ChatMessageResponse): boolean {
    return this.messages.some(m =>
      m.messageType === 'ACKNOWLEDGEMENT_RESPONSE' &&
      Number(m.metaData?.['parentMessageId']) === parentMessage.id &&
      m.sender?.id === this.currentUserId
    );
  }

  downloadFile(file: any): void {
    this.chatService.downloadFile(file.id).subscribe({
      next: (response) => {
        const blob = response.body;
        const contentDisposition = response.headers.get('content-disposition');
        let filename = file.name;

        if (contentDisposition) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const url = window.URL.createObjectURL(blob!);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error downloading file:', err)
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  }

  openActionRegistry() {
    this.isActionRegistryOpen = true;
  }

  closeActionRegistry() {
    this.isActionRegistryOpen = false;
  }

  updateActionRegistry() {
    const actionMessages = this.messages.filter(m => m.messageType !== 'TEXT');
    const groups: { date: string, actions: ChatMessageResponse[] }[] = [];

    actionMessages.forEach(msg => {
      try {
        const date = new Date(msg.timestamp).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        let group = groups.find(g => g.date === date);
        if (!group) {
          group = { date, actions: [] };
          groups.push(group);
        }
        group.actions.push(msg);
      } catch (e) {
        console.error('Error processing message date', e);
      }
    });

    this.groupedActionMessages = groups;
  }

  getActionText(msg: ChatMessageResponse): string {
    switch (msg.messageType) {
      case 'COORDINATION_REQUEST':
        return 'направил запрос на согласование';
      case 'COORDINATION_RESPONSE':
        return msg.metaData?.['status'] === 'APPROVED'
          ? 'согласовал смету'
          : 'отклонил смету';
      case 'ACKNOWLEDGEMENT_REQUEST':
        return 'направил на ознакомление';
      case 'ACKNOWLEDGEMENT_RESPONSE':
        return 'ознакомился с ГПР';
      default:
        return 'выполнил действие';
    }
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  getParticipantNames(): string {
    if (!this.selectedConversation) return '';
    return this.selectedConversation.participants.map(p => p.fullName).join(', ');
  }

  get availableParticipantsForMention(): any[] {
    if (!this.selectedConversation) return [];
    if (!this.currentUserId) return this.selectedConversation.participants;
    return this.selectedConversation.participants.filter(p => p.id !== this.currentUserId);
  }
}
