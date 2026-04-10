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
import com.smartqurylys.backend.shared.enums.ActivityActionType;
import com.smartqurylys.backend.shared.enums.ActivityEntityType;
import com.smartqurylys.backend.shared.enums.ProjectStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ParticipantInvitationService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ParticipantInvitationRepository invitationRepository;
    private final ParticipantRepository participantRepository;
    private final NotificationService notificationService;
    private final com.smartqurylys.backend.repository.NotificationRepository notificationRepository;
    private final ActivityLogService activityLogService;
    private final ProjectRealtimeService projectRealtimeService;

    public InvitationResponse sendInvitation(Long projectId, CreateInvitationRequest request, User sender) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        if (project.getStatus() == ProjectStatus.DRAFT || project.getStatus() == ProjectStatus.WAITING) {
            throw new IllegalArgumentException("Invitations are unavailable while the project is in draft");
        }
        if (project.getStatus() == ProjectStatus.COMPLETED || project.getStatus() == ProjectStatus.CANCELLED) {
            throw new IllegalArgumentException("Invitations are unavailable for completed or cancelled projects");
        }

        User user = userRepository.findByIinBin(request.getIinBin())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Пользователь с таким ИИН/БИН не найден"));

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
                .expiresAt(LocalDateTime.now().plusDays(3))
                .build();

        invitationRepository.save(invitation);

        activityLogService.recordActivity(
                projectId,
                ActivityActionType.PARTICIPANT_INVITED,
                ActivityEntityType.PARTICIPANT,
                invitation.getId(),
                user.getFullName());

        notificationService.createInvitationNotification(invitation);
        projectRealtimeService.publish(projectId, "PARTICIPANT_INVITED", invitation.getId());

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

    @Transactional
    public void cancelInvitation(Long invitationId, User currentUser) {
        ParticipantInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Приглашение не найдено"));

        Project project = invitation.getProject();
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = "ADMIN".equals(currentUser.getRole());

        if (!isOwner && !isAdmin) {
            throw new SecurityException("Доступ запрещён: только владелец проекта может отменять приглашения");
        }

        invitationRepository.delete(invitation);
        projectRealtimeService.publish(project.getId(), "PARTICIPANT_INVITATION_CANCELED", invitationId);

        notificationRepository.findByTypeAndRelatedEntityId(
                com.smartqurylys.backend.entity.NotificationType.INVITATION, invitationId)
                .ifPresent(notificationRepository::delete);
    }

    @Transactional
    public void acceptInvitation(Long invitationId, User currentUser) {
        ParticipantInvitation invitation = invitationRepository.findByIdAndUser(invitationId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Приглашение не найдено или недоступно"));

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
                .isOwner(false)
                .canUploadDocuments(invitation.isCanUploadDocuments())
                .canSendNotifications(invitation.isCanSendNotifications())
                .build();

        Participant savedParticipant = participantRepository.save(participant);
        invitationRepository.delete(invitation);

        activityLogService.recordActivity(
                invitation.getProject().getId(),
                ActivityActionType.PARTICIPANT_JOINED,
                ActivityEntityType.PARTICIPANT,
                savedParticipant.getId(),
                currentUser.getFullName());

        projectRealtimeService.publish(invitation.getProject().getId(), "PARTICIPANT_JOINED", savedParticipant.getId());

        notificationRepository.findByTypeAndRelatedEntityId(
                com.smartqurylys.backend.entity.NotificationType.INVITATION, invitationId)
                .ifPresent(notificationRepository::delete);
    }

    @Transactional
    public void declineInvitation(Long invitationId, User currentUser) {
        ParticipantInvitation invitation = invitationRepository.findByIdAndUser(invitationId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Приглашение не найдено или недоступно"));

        Long projectId = invitation.getProject().getId();
        invitationRepository.delete(invitation);
        projectRealtimeService.publish(projectId, "PARTICIPANT_INVITATION_DECLINED", invitationId);

        notificationRepository.findByTypeAndRelatedEntityId(
                com.smartqurylys.backend.entity.NotificationType.INVITATION, invitationId)
                .ifPresent(notificationRepository::delete);
    }

    @Transactional
    public List<ParticipantInvitation> getInvitationsByProject(Long projectId) {
        return invitationRepository.findAllByProjectId(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Приглашения в проекте не найдены"));
    }
}

