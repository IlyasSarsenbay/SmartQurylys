package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.participant.ParticipantResponse;
import com.smartqurylys.backend.dto.project.participant.UpdateParticipantRequest;
import com.smartqurylys.backend.entity.Participant;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.Task;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.ParticipantRepository;
import com.smartqurylys.backend.repository.ProjectRepository;
import com.smartqurylys.backend.repository.TaskRepository;
import com.smartqurylys.backend.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ParticipantService {

    private final ParticipantRepository participantRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public List<ParticipantResponse> getParticipantsByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        User currentUser = getAuthenticatedUser();
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isParticipant = participantRepository.existsByProjectAndUser(project, currentUser);
        boolean isAdmin = "ADMIN".equals(currentUser.getRole());

        if (!isOwner && !isParticipant && !isAdmin) {
            throw new SecurityException("Доступ запрещён: вы не являетесь участником проекта");
        }

        return participantRepository.findByProject(project).stream()
                .map(ParticipantService::mapToParticipantResponse)
                .toList();
    }

    public List<Participant> getParticipantsEntitiesByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        return participantRepository.findByProject(project);
    }

    public ParticipantResponse updateParticipant(Long participantId, UpdateParticipantRequest request) {
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Участник не найден"));

        Project project = participant.getProject();
        User currentUser = getAuthenticatedUser();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new SecurityException("Доступ запрещён: только владелец проекта может обновлять участников");
        }

        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            participant.setRole(request.getRole().trim());
        }
        if (request.getCanUploadDocuments() != null) {
            participant.setCanUploadDocuments(request.getCanUploadDocuments());
        }
        if (request.getCanSendNotifications() != null) {
            participant.setCanSendNotifications(request.getCanSendNotifications());
        }

        Participant updatedParticipant = participantRepository.save(participant);
        return mapToParticipantResponse(updatedParticipant);
    }

    public void removeParticipant(Long participantId) {
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Участник не найден"));

        Project project = participant.getProject();
        User currentUser = getAuthenticatedUser();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new SecurityException("Доступ запрещён: только владелец проекта может удалять участников");
        }
        if (participant.isOwner()) {
            throw new IllegalArgumentException("Нельзя удалить владельца проекта из участников");
        }

        List<Task> tasks = taskRepository.findByResponsiblePersonsContains(participant);
        for (Task task : tasks) {
            task.getResponsiblePersons().remove(participant);
        }
        taskRepository.saveAll(tasks);

        participantRepository.delete(participant);
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = principal instanceof UserDetails userDetails ? userDetails.getUsername() : principal.toString();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    public static ParticipantResponse mapToParticipantResponse(Participant participant) {
        if (participant == null) {
            return null;
        }

        return ParticipantResponse.builder()
                .id(participant.getId())
                .fullName(participant.getUser().getFullName())
                .iinBin(participant.getUser().getIinBin())
                .organization(participant.getUser().getOrganization())
                .phone(participant.getUser().getPhone())
                .email(participant.getUser().getEmail())
                .role(participant.getRole())
                .canUploadDocuments(participant.isCanUploadDocuments())
                .canSendNotifications(participant.isCanSendNotifications())
                .owner(participant.isOwner())
                .build();
    }

    public static List<ParticipantResponse> mapToParticipantResponseList(List<Participant> participants) {
        if (participants == null) {
            return List.of();
        }

        return participants.stream()
                .filter(Objects::nonNull)
                .map(ParticipantService::mapToParticipantResponse)
                .toList();
    }
}
