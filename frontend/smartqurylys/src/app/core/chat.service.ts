import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ConversationResponse, ChatMessageResponse, CreatePrivateConversationRequest } from './models/chat';
import { UserResponse } from './models/user';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private conversationsUrl = `${environment.apiUrl}/conversations`;
    private messagesUrl = `${environment.apiUrl}/chat-messages`;
    private usersUrl = `${environment.apiUrl}/users`;

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getConversations(): Observable<ConversationResponse[]> {
        return this.http.get<ConversationResponse[]>(`${this.conversationsUrl}/my`, { headers: this.getAuthHeaders() });
    }

    getOrCreateProjectConversation(projectId: number): Observable<ConversationResponse> {
        return this.http.post<ConversationResponse>(`${this.conversationsUrl}/project/${projectId}`, {}, { headers: this.getAuthHeaders() });
    }

    getOrCreatePrivateConversation(targetUserId: number): Observable<ConversationResponse> {
        const request: CreatePrivateConversationRequest = { targetUserId };
        return this.http.post<ConversationResponse>(`${this.conversationsUrl}/private`, request, { headers: this.getAuthHeaders() });
    }

    getMessageHistory(conversationId: number): Observable<ChatMessageResponse[]> {
        return this.http.get<ChatMessageResponse[]>(`${this.messagesUrl}/conversation/${conversationId}/history`, { headers: this.getAuthHeaders() });
    }

    sendMessage(
        conversationId: number,
        content: string,
        messageType: string = 'TEXT',
        attachedFile?: File,
        mentionedUserIds: number[] = [],
        relatedMessageId?: number,
        metaData?: any
    ): Observable<ChatMessageResponse> {
        const formData = new FormData();
        const messageData = {
            conversationId: conversationId,
            content: content,
            messageType: messageType,
            mentionedUserIds: mentionedUserIds,
            relatedMessageId: relatedMessageId,
            metaData: metaData
        };

        formData.append('messageData', new Blob([JSON.stringify(messageData)], { type: 'application/json' }));
        if (attachedFile) {
            formData.append('attachedFile', attachedFile);
        }

        return this.http.post<ChatMessageResponse>(this.messagesUrl, formData, {
            headers: new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` })
        });
    }

    searchUsers(query: string): Observable<UserResponse[]> {
        return this.http.get<UserResponse[]>(`${this.usersUrl}/search`, {
            params: { query },
            headers: this.getAuthHeaders()
        });
    }

    sendAcknowledgmentResponse(parentMessageId: number, conversationId: number): Observable<ChatMessageResponse> {
        const formData = new FormData();
        const messageData = {
            conversationId: conversationId,
            content: 'Ознакомлен',
            messageType: 'ACKNOWLEDGEMENT_RESPONSE',
            relatedMessageId: parentMessageId,
            metaData: {
                parentMessageId: parentMessageId.toString()
            }
        };

        formData.append('messageData', new Blob([JSON.stringify(messageData)], { type: 'application/json' }));

        return this.http.post<ChatMessageResponse>(this.messagesUrl, formData, {
            headers: new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` })
        });
    }

    downloadFile(fileId: number): Observable<HttpResponse<Blob>> {
        return this.http.get(`${environment.apiUrl}/files/download/${fileId}`, {
            responseType: 'blob',
            observe: 'response',
            headers: this.getAuthHeaders()
        });
    }

    getFileDownloadUrl(fileId: number): string {
        return `${environment.apiUrl}/files/${fileId}/download`;
    }
}
