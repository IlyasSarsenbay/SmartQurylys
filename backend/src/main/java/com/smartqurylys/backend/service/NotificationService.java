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

// Сервис для управления уведомлениями пользователей.
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final NotificationRealtimeService notificationRealtimeService;


    // Создаёт уведомление о приглашении участника в проект.
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

        saveAndPublish(notification);
    }

    // Получает список уведомлений текущего пользователя.
    public List<NotificationResponse> getUserNotifications(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }


    // Отмечает все уведомления пользователя как прочитанные.
    @org.springframework.transaction.annotation.Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForRecipient(user);
        notificationRealtimeService.publish(user.getId(), "READ_ALL", null);
    }

    // Удаляет уведомление по идентификатору.
    @org.springframework.transaction.annotation.Transactional
    public void deleteNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        Long recipientId = notification.getRecipient().getId();
        notificationRepository.delete(notification);
        notificationRealtimeService.publish(recipientId, "DELETED", notificationId);
    }

    // Преобразует сущность Notification в DTO NotificationResponse.
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
    
    // Создаёт уведомление об упоминании пользователя в чате.
    public void createMentionNotification(User sender, User recipient, com.smartqurylys.backend.entity.Conversation conversation) {
        String message = String.format("%s отметил вас в чате: %s", sender.getFullName(), conversation.getName());

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .project(null) // Может быть null для личных чатов.
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .type(NotificationType.MENTION)
                .relatedEntityId(conversation.getId())
                .build();

        saveAndPublish(notification);
    }

    public void createTaskReviewRequestedNotification(
            User recipient,
            User sender,
            com.smartqurylys.backend.entity.Project project,
            Long taskId,
            String taskName
    ) {
        String message = String.format("%s отправил задачу «%s» по проекту «%s» на подтверждение выполнения",
                sender.getFullName(),
                taskName,
                project.getName());

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .project(project)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .type(NotificationType.TASK_REVIEW_REQUESTED)
                .relatedEntityId(taskId)
                .build();

        saveAndPublish(notification);
    }

    // Создаёт уведомление о возврате этапа в активное состояние.
    public void createStageReturnNotification(User recipient, com.smartqurylys.backend.entity.Project project, String message, Long stageId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(project.getOwner()) // Владелец проекта возвращает этап в работу.
                .project(project)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .type(NotificationType.STAGE_REACTIVATION)
                .relatedEntityId(stageId)
                .build();

        saveAndPublish(notification);
    }

    // Создаёт уведомление о результате рассмотрения лицензии администратором.
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
                .sender(null) // Системное уведомление от администратора.
                .project(null)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .type(approved ? NotificationType.LICENSE_APPROVED : NotificationType.LICENSE_REJECTED)
                .relatedEntityId(licenseId)
                .build();

        saveAndPublish(notification);
    }

    // Создаёт уведомление о результате рассмотрения документа представителя администратором.
    public void createRepresentativeDocumentReviewNotification(User recipient, String documentName, boolean approved, Long documentId, String rejectionReason) {
        String status = approved ? "одобрен" : "отклонен";
        String message;
        
        if (approved) {
            message = String.format("Ваш документ представителя \"%s\" был %s администратором", documentName, status);
        } else {
            if (rejectionReason != null && !rejectionReason.trim().isEmpty()) {
                message = String.format("Ваш документ представителя \"%s\" был %s администратором. Причина: %s", documentName, status, rejectionReason);
            } else {
                message = String.format("Ваш документ представителя \"%s\" был %s администратором", documentName, status);
            }
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(null)
                .project(null)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .type(approved ? NotificationType.LICENSE_APPROVED : NotificationType.LICENSE_REJECTED)
                .relatedEntityId(documentId)
                .build();

        saveAndPublish(notification);
    }

    // Создаёт уведомление о результате рассмотрения выполнения задачи (принята, отклонена, возвращена).
    public void createTaskExecutionNotification(User recipient, User sender,
                                                com.smartqurylys.backend.entity.Project project,
                                                Long taskId, String taskName,
                                                NotificationType type, String reason) {
        String action;
        switch (type) {
            case TASK_ACCEPTED -> action = "принята";
            case TASK_DECLINED -> action = "отклонена";
            case TASK_RETURNED -> action = "возвращена в работу";
            default -> action = "обновлена";
        }
        String message;
        if (reason != null && !reason.trim().isEmpty()) {
            message = String.format("Задача «%s» по проекту «%s» %s. Причина: %s",
                    taskName,
                    project.getName(),
                    action,
                    reason.trim());
        } else {
            message = String.format("Задача «%s» по проекту «%s» %s.",
                    taskName,
                    project.getName(),
                    action);
        }
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .project(project)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .type(type)
                .relatedEntityId(taskId)
                .build();

        saveAndPublish(notification);
    }

    private void saveAndPublish(Notification notification) {
        Notification savedNotification = notificationRepository.save(notification);
        notificationRealtimeService.publish(
                savedNotification.getRecipient().getId(),
                "CREATED",
                savedNotification.getId()
        );
    }
}
