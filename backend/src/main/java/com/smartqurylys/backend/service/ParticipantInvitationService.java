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

@Service
@RequiredArgsConstructor
public class ParticipantInvitationService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ParticipantInvitationRepository invitationRepository;
    private final ParticipantRepository participantRepository;

    public InvitationResponse sendInvitation(Long projectId, CreateInvitationRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        User user = userRepository.findByIinBin(request.getIinBin())
                .orElseThrow(() -> new IllegalArgumentException("Пользователь с таким ИИН/БИН не найден"));

        if (invitationRepository.findByProjectAndUser(project, user).isPresent()) {
            throw new IllegalArgumentException("Пользователь уже приглашен в проект");
        }
        if (participantRepository.existsByProjectAndUser(project, user)) {
            throw new IllegalArgumentException("Пользователь уже является участником проекта");
        }

        ParticipantInvitation invitation = ParticipantInvitation.builder()
                .project(project)
                .user(user)
                .role(request.getRole())
                .canUploadDocuments(request.isCanUploadDocuments())
                .canSendNotifications(request.isCanSendNotifications())
                .accepted(false)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(3))
                .build();

        invitationRepository.save(invitation);

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

        participantRepository.save(participant);
        invitationRepository.delete(invitation);
    }

    public void declineInvitation(Long invitationId, User currentUser) {
        ParticipantInvitation invitation = invitationRepository.findByIdAndUser(invitationId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Приглашение не найдено или недоступно"));

        invitationRepository.delete(invitation);
    }
}
