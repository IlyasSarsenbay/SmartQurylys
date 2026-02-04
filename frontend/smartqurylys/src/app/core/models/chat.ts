import { UserResponse } from './user';
import { FileResponse } from './file';

export interface ConversationResponse {
    id: number;
    type: 'PROJECT_CHAT' | 'PRIVATE_CHAT';
    projectId?: number;
    name: string;
    participants: UserResponse[];
    lastMessageTimestamp: string;
    lastMessageContent?: string; // Optinal field for preview
}

export interface ChatMessageRequest {
    conversationId: number;
    content: string;
    messageType: string;
    mentionedUserIds?: number[];
    relatedMessageId?: number[];
    metaData?: { [key: string]: string };
}

export interface ChatMessageResponse {
    id: number;
    conversationId: number;
    sender: UserResponse;
    content: string;
    attachedFile?: FileResponse;
    timestamp: string;
    messageType: string;
    mentionedUsers: UserResponse[];
    coordinationStatus?: string;
    acknowledgementStatus?: string;
    relatedMessageId?: number;
    metaData?: { [key: string]: string };
}

export interface CreatePrivateConversationRequest {
    targetUserId: number;
}
