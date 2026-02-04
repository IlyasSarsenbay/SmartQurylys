package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.NotificationResponse;
import com.smartqurylys.backend.entity.Notification;
import com.smartqurylys.backend.entity.NotificationType;
import com.smartqurylys.backend.entity.ParticipantInvitation;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;


    public void createInvitationNotification(ParticipantInvitation invitation) {
        User sender = invitation.getSender();
        User recipient = invitation.getUser();
        String projectName = invitation.getProject().getName();
        String role = invitation.getRole();

        String message = String.format("%s (БИН %s) приглашает вас принять участие в проекте %s в качестве %s",
                sender.getFullName(), sender.getIinBin(), projectName, role);

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .project(invitation.getProject())
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .type(NotificationType.INVITATION)
                .relatedEntityId(invitation.getId())
                .build();

        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getUserNotifications(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @org.springframework.transaction.annotation.Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForRecipient(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notificationRepository.delete(notification);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .type(notification.getType())
                .projectId(notification.getProject() != null ? notification.getProject().getId() : null)
                .senderName(notification.getSender() != null ? notification.getSender().getFullName() : "Система")
                .relatedEntityId(notification.getRelatedEntityId())
                .build();
    }
    
    public void createMentionNotification(User sender, User recipient, com.smartqurylys.backend.entity.Conversation conversation) {
        String message = String.format("%s отметил вас в чате: %s", sender.getFullName(), conversation.getName());

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .project(null) // Can be null for private chats, or conversation.getProject() if available
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .type(NotificationType.MENTION)
                .relatedEntityId(conversation.getId())
                .build();

        notificationRepository.save(notification);
    }

    public void createStageReturnNotification(User recipient, com.smartqurylys.backend.entity.Project project, String message, Long stageId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(project.getOwner()) // Assume owner is the one returning it to active
                .project(project)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .type(NotificationType.STAGE_REACTIVATION)
                .relatedEntityId(stageId)
                .build();

        notificationRepository.save(notification);
    }

    public void createLicenseReviewNotification(User recipient, String licenseName, boolean approved, Long licenseId, String rejectionReason) {
        String status = approved ? "одобрена" : "отклонена";
        String message;
        
        if (approved) {
            message = String.format("Ваша лицензия \"%s\" была %s администратором", licenseName, status);
        } else {
            if (rejectionReason != null && !rejectionReason.trim().isEmpty()) {
                message = String.format("Ваша лицензия \"%s\" была %s администратором. Причина: %s", licenseName, status, rejectionReason);
            } else {
                message = String.format("Ваша лицензия \"%s\" была %s администратором", licenseName, status);
            }
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(null) // Admin notification, no specific sender
                .project(null)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .type(approved ? NotificationType.LICENSE_APPROVED : NotificationType.LICENSE_REJECTED)
                .relatedEntityId(licenseId)
                .build();

        notificationRepository.save(notification);
    }
}
