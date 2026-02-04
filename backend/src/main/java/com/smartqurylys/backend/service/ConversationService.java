package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.chat.ConversationResponse;
import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.entity.Conversation;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.ConversationRepository;
import com.smartqurylys.backend.repository.ProjectRepository;
import com.smartqurylys.backend.repository.UserRepository;
import com.smartqurylys.backend.shared.enums.ConversationType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

// Сервис для управления беседами в чате, включая создание и получение чатов проектов и личных чатов.
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    // Получает или создает чат для указанного проекта.
    @Transactional
    public ConversationResponse getOrCreateProjectChat(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден с ID: " + projectId));

        Optional<Conversation> existingChat = conversationRepository.findByTypeAndProjectId(ConversationType.PROJECT_CHAT, projectId);

        if (existingChat.isPresent()) {
            return mapToConversationResponse(existingChat.get()); // Возвращаем существующий чат.
        } else {
            // Создаем новый чат проекта, если его нет.
            Conversation newChat = Conversation.builder()
                    .type(ConversationType.PROJECT_CHAT)
                    .project(project)
                    .name("Чат проекта: " + project.getName())
                    .lastMessageTimestamp(LocalDateTime.now())
                    .build();
            Conversation savedChat = conversationRepository.save(newChat);
            return mapToConversationResponse(savedChat);
        }
    }

    // Получает или создает личный чат между двумя пользователями.
    @Transactional
    public ConversationResponse getOrCreatePrivateChat(Long user1Id, Long user2Id) {
        if (user1Id.equals(user2Id)) {
            throw new IllegalArgumentException("Невозможно создать личный чат с самим собой.");
        }

        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь 1 не найден с ID: " + user1Id));
        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь 2 не найден с ID: " + user2Id));

        Optional<Conversation> existingChat = conversationRepository.findPrivateChatBetweenUsers(user1, user2);

        if (existingChat.isPresent()) {
            return mapToConversationResponse(existingChat.get()); // Возвращаем существующий личный чат.
        } else {
            // Создаем новый личный чат, если его нет.
            Set<User> participants = new HashSet<>();
            participants.add(user1);
            participants.add(user2);

            Conversation newChat = Conversation.builder()
                    .type(ConversationType.PRIVATE_CHAT)
                    .participants(participants)
                    .name(user1.getFullName() + " & " + user2.getFullName()) // Генерируем название чата.
                    .lastMessageTimestamp(LocalDateTime.now())
                    .build();
            Conversation savedChat = conversationRepository.save(newChat);
            return mapToConversationResponse(savedChat);
        }
    }

    // Получает все беседы, в которых участвует текущий пользователь.
    @Transactional(readOnly = true)
    public List<ConversationResponse> getUserConversations() {
        User currentUser = userService.getCurrentUserEntity(); // Используем метод получения текущего пользователя.
        return conversationRepository.findUserConversations(currentUser).stream()
                .map(this::mapToConversationResponse)
                .collect(Collectors.toList());
    }

    // Получает информацию о беседе по ее ID.
    @Transactional(readOnly = true)
    public ConversationResponse getConversationById(Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Беседа не найдена с ID: " + conversationId));
        return mapToConversationResponse(conversation);
    }

    // Преобразует сущность Conversation в DTO ConversationResponse.
    private ConversationResponse mapToConversationResponse(Conversation conversation) {
        List<UserResponse> participantResponses = Collections.emptyList();
        
        // For project chats, get participants from project + owner
        if (conversation.getType() == ConversationType.PROJECT_CHAT && conversation.getProject() != null) {
            participantResponses = conversation.getProject().getParticipants().stream()
                    .map(participant -> userService.mapToUserResponse(participant.getUser()))
                    .collect(Collectors.toList());
            
            // Add project owner if not already in participants
            User owner = conversation.getProject().getOwner();
            if (owner != null) {
                boolean ownerAlreadyIncluded = participantResponses.stream()
                        .anyMatch(p -> p.getId().equals(owner.getId()));
                if (!ownerAlreadyIncluded) {
                    participantResponses.add(userService.mapToUserResponse(owner));
                }
            }
        } 
        // For private chats, get participants from conversation
        else if (conversation.getParticipants() != null && !conversation.getParticipants().isEmpty()) {
            participantResponses = conversation.getParticipants().stream()
                    .map(userService::mapToUserResponse)
                    .collect(Collectors.toList());
        }

        return ConversationResponse.builder()
                .id(conversation.getId())
                .type(conversation.getType().name())
                .projectId(conversation.getProject() != null ? conversation.getProject().getId() : null)
                .name(conversation.getName())
                .participants(participantResponses)
                .lastMessageTimestamp(conversation.getLastMessageTimestamp())
                .build();
    }
}
