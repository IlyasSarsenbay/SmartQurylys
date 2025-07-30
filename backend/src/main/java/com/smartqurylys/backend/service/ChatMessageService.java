package com.smartqurylys.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartqurylys.backend.dto.chat.ChatMessageRequest;
import com.smartqurylys.backend.dto.chat.ChatMessageResponse;
import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.entity.ChatMessage;
import com.smartqurylys.backend.entity.Conversation;
import com.smartqurylys.backend.entity.File;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.ChatMessageRepository;
import com.smartqurylys.backend.repository.ConversationRepository;
import com.smartqurylys.backend.repository.UserRepository;
import com.smartqurylys.backend.shared.enums.AcknowledgementStatus;
import com.smartqurylys.backend.shared.enums.ConversationType;
import com.smartqurylys.backend.shared.enums.CoordinationStatus;
import com.smartqurylys.backend.shared.enums.MessageType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final FileService fileService;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageResponse sendMessage(ChatMessageRequest request, MultipartFile attachedFile) throws IOException {
        User sender = userService.getCurrentUserEntity();
        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new EntityNotFoundException("Беседа не найдена с ID: " + request.getConversationId()));

        if (conversation.getType() == ConversationType.PRIVATE_CHAT && !conversation.getParticipants().contains(sender)) {
            throw new SecurityException("Доступ запрещен: Вы не являетесь участником этой беседы.");
        }

        File savedFile = null;
        if (attachedFile != null && !attachedFile.isEmpty()) {
            savedFile = fileService.prepareFile(attachedFile, sender);
        } else if (request.getTempFileId() != null) {
        }


        Set<User> mentionedUsers = new HashSet<>();
        if (request.getMentionedUserIds() != null && !request.getMentionedUserIds().isEmpty()) {
            mentionedUsers = new HashSet<>(userRepository.findAllById(request.getMentionedUserIds()));
            if (mentionedUsers.size() != request.getMentionedUserIds().size()) {
                throw new IllegalArgumentException("Один или несколько отмеченных пользователей не найдены.");
            }
        }

        ChatMessage relatedMessage = null;
        if (request.getRelatedMessageId() != null) {
            relatedMessage = chatMessageRepository.findById(request.getRelatedMessageId())
                    .orElseThrow(() -> new EntityNotFoundException("Связанное сообщение не найдено с ID: " + request.getRelatedMessageId()));
        }

        String metaDataJson = null;
        if (request.getMetaData() != null && !request.getMetaData().isEmpty()) {
            try {
                metaDataJson = objectMapper.writeValueAsString(request.getMetaData());
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Некорректный формат метаданных: " + e.getMessage());
            }
        }

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getContent())
                .attachedFile(savedFile)
                .timestamp(LocalDateTime.now())
                .messageType(MessageType.valueOf(request.getMessageType()))
                .mentionedUsers(mentionedUsers)
                .coordinationStatus(null)
                .acknowledgementStatus(null)
                .relatedMessage(relatedMessage)
                .metaData(metaDataJson)
                .build();

        if (message.getMessageType() == MessageType.COORDINATION_REQUEST) {
            message.setCoordinationStatus(CoordinationStatus.PENDING);
        } else if (message.getMessageType() == MessageType.ACKNOWLEDGEMENT_REQUEST) {
            message.setAcknowledgementStatus(AcknowledgementStatus.PENDING);
        } else if (message.getMessageType() == MessageType.COORDINATION_RESPONSE) {
            if (relatedMessage == null || relatedMessage.getMessageType() != MessageType.COORDINATION_REQUEST) {
                throw new IllegalArgumentException("Ответ на согласование должен быть связан с запросом на согласование.");
            }
            String status = request.getMetaData().get("status");
            if ("APPROVED".equalsIgnoreCase(status)) {
                message.setCoordinationStatus(CoordinationStatus.APPROVED);
            } else if ("REJECTED".equalsIgnoreCase(status)) {
                message.setCoordinationStatus(CoordinationStatus.REJECTED);
            } else {
                throw new IllegalArgumentException("Некорректный статус согласования в метаданных.");
            }

        } else if (message.getMessageType() == MessageType.ACKNOWLEDGEMENT_RESPONSE) {
            if (relatedMessage == null || relatedMessage.getMessageType() != MessageType.ACKNOWLEDGEMENT_REQUEST) {
                throw new IllegalArgumentException("Ответ на ознакомление должен быть связан с запросом на ознакомление.");
            }
            message.setAcknowledgementStatus(AcknowledgementStatus.ACKNOWLEDGED);
        }

        ChatMessage savedMessage = chatMessageRepository.save(message);

        conversation.setLastMessageTimestamp(savedMessage.getTimestamp());
        conversationRepository.save(conversation);

        ChatMessageResponse response = mapToChatMessageResponse(savedMessage);

        messagingTemplate.convertAndSend("/topic/conversations/" + response.getConversationId() + "/messages", response);

        return response;
    }


    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessageHistory(Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Беседа не найдена с ID: " + conversationId));

        User currentUser = userService.getCurrentUserEntity();
        if (conversation.getType() == ConversationType.PRIVATE_CHAT && !conversation.getParticipants().contains(currentUser)) {
            throw new SecurityException("Доступ запрещен: Вы не являетесь участником этой беседы.");
        }

        return chatMessageRepository.findByConversationOrderByTimestampAsc(conversation).stream()
                .map(this::mapToChatMessageResponse)
                .collect(Collectors.toList());
    }

    private ChatMessageResponse mapToChatMessageResponse(ChatMessage message) {
        UserResponse senderResponse = userService.mapToUserResponse(message.getSender());

        FileResponse attachedFileResponse = null;
        if (message.getAttachedFile() != null) {
            attachedFileResponse = fileService.mapToFileResponse(message.getAttachedFile());
        }

        List<UserResponse> mentionedUserResponses = Collections.emptyList();
        if (message.getMentionedUsers() != null && !message.getMentionedUsers().isEmpty()) {
            mentionedUserResponses = message.getMentionedUsers().stream()
                    .map(userService::mapToUserResponse)
                    .collect(Collectors.toList());
        }

        Map<String, String> metaDataMap = null;
        if (message.getMetaData() != null) {
            try {
                metaDataMap = objectMapper.readValue(message.getMetaData(), Map.class);
            } catch (JsonProcessingException e) {
                System.err.println("Ошибка при парсинге метаданных сообщения " + message.getId() + ": " + e.getMessage());
            }
        }

        return ChatMessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .sender(senderResponse)
                .content(message.getContent())
                .attachedFile(attachedFileResponse)
                .timestamp(message.getTimestamp())
                .messageType(message.getMessageType().name())
                .mentionedUsers(mentionedUserResponses)
                .coordinationStatus(message.getCoordinationStatus() != null ? message.getCoordinationStatus().name() : null)
                .acknowledgementStatus(message.getAcknowledgementStatus() != null ? message.getAcknowledgementStatus().name() : null)
                .relatedMessageId(message.getRelatedMessage() != null ? message.getRelatedMessage().getId() : null)
                .metaData(metaDataMap)
                .build();
    }
}