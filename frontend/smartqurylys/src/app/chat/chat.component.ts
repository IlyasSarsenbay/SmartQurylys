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
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
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
