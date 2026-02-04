package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.participant.CreateInvitationRequest;
import com.smartqurylys.backend.dto.project.participant.InvitationResponse;
import com.smartqurylys.backend.entity.Participant;
import com.smartqurylys.backend.entity.ParticipantInvitation;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.ParticipantInvitationRepository;
import com.smartqurylys.backend.repository.ParticipantRepository;
import com.smartqurylys.backend.repository.ProjectRepository;
import com.smartqurylys.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

// Сервис для управления приглашениями участников в проекты.
@Service
@RequiredArgsConstructor
public class ParticipantInvitationService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ParticipantInvitationRepository invitationRepository;
    private final ParticipantRepository participantRepository;
    private final NotificationService notificationService;
    private final com.smartqurylys.backend.repository.NotificationRepository notificationRepository;

    // Отправляет приглашение пользователю в проект.
    public InvitationResponse sendInvitation(Long projectId, CreateInvitationRequest request, User sender) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        User user = userRepository.findByIinBin(request.getIinBin())
                .orElseThrow(() -> new IllegalArgumentException("Пользователь с таким ИИН/БИН не найден"));

        // Проверяем, не был ли пользователь уже приглашен или не является ли он уже участником.
        if (invitationRepository.findByProjectAndUser(project, user).isPresent()) {
            throw new IllegalArgumentException("Пользователь уже приглашен в проект");
        }
        if (participantRepository.existsByProjectAndUser(project, user)) {
            throw new IllegalArgumentException("Пользователь уже является участником проекта");
        }

        ParticipantInvitation invitation = ParticipantInvitation.builder()
                .project(project)
                .user(user)
                .sender(sender)
                .role(request.getRole())
                .canUploadDocuments(request.isCanUploadDocuments())
                .canSendNotifications(request.isCanSendNotifications())
                .accepted(false)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(3)) // Приглашение действует 3 дня.
                .build();

        invitationRepository.save(invitation);

        notificationService.createInvitationNotification(invitation);

        return InvitationResponse.builder()
                .id(invitation.getId())
                .projectName(project.getName())
                .userFullName(user.getFullName())
                .role(invitation.getRole())
                .canUploadDocuments(invitation.isCanUploadDocuments())
                .canSendNotifications(invitation.isCanSendNotifications())
                .createdAt(invitation.getCreatedAt())
                .expiresAt(invitation.getExpiresAt())
                .build();
    }

    // Принимает приглашение в проект.
    @Transactional
    public void acceptInvitation(Long invitationId, User currentUser) {
        ParticipantInvitation invitation = invitationRepository.findByIdAndUser(invitationId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Приглашение не найдено или недоступно"));

        if (invitation.isAccepted()) {
            throw new IllegalArgumentException("Приглашение уже принято");
        }

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Срок действия приглашения истёк");
        }

        invitation.setAccepted(true);
        Participant participant = Participant.builder()
                .project(invitation.getProject())
                .user(currentUser)
                .role(invitation.getRole())
                .canUploadDocuments(invitation.isCanUploadDocuments())
                .canSendNotifications(invitation.isCanSendNotifications())
                .build();

        participantRepository.save(participant); // Создаем нового участника проекта.
        invitationRepository.delete(invitation); // Удаляем приглашение после принятия.

        // Удаляем связанное уведомление
        notificationRepository.findByTypeAndRelatedEntityId(com.smartqurylys.backend.entity.NotificationType.INVITATION, invitationId)
                .ifPresent(notificationRepository::delete);
    }

    // Отклоняет приглашение в проект.
    @Transactional
    public void declineInvitation(Long invitationId, User currentUser) {
        ParticipantInvitation invitation = invitationRepository.findByIdAndUser(invitationId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Приглашение не найдено или недоступно"));

        invitationRepository.delete(invitation); // Удаляем приглашение.

        // Удаляем связанное уведомление
        notificationRepository.findByTypeAndRelatedEntityId(com.smartqurylys.backend.entity.NotificationType.INVITATION, invitationId)
                .ifPresent(notificationRepository::delete);
    }
}
