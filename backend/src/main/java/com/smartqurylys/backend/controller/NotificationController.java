package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.chat.MentionNotificationRequest;
import com.smartqurylys.backend.dto.project.NotificationResponse;
import com.smartqurylys.backend.entity.Conversation;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.ConversationRepository;
import com.smartqurylys.backend.repository.UserRepository;
import com.smartqurylys.backend.service.NotificationService;
import com.smartqurylys.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getUserNotifications() {
        User currentUser = userService.getCurrentUserEntity();
        List<NotificationResponse> notifications = notificationService.getUserNotifications(currentUser);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        User currentUser = userService.getCurrentUserEntity();
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mention")
    public ResponseEntity<Void> createMentionNotification(@RequestBody MentionNotificationRequest request) {
        User currentUser = userService.getCurrentUserEntity();
        
        // Получаем упомянутого пользователя
        User mentionedUser = userRepository.findById(request.getMentionedUserId())
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        
        // Получаем беседу
        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new IllegalArgumentException("Беседа не найдена"));
        
        // Создаем уведомление об упоминании
        notificationService.createMentionNotification(currentUser, mentionedUser, conversation);
        
        return ResponseEntity.ok().build();
    }
}