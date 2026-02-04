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
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

// Сервис для управления участниками проекта.
@Service
@RequiredArgsConstructor
public class ParticipantService {

    private final ParticipantRepository participantRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    // Получает список участников для указанного проекта. Доступно только владельцу проекта.
    public List<ParticipantResponse> getParticipantsByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        User currentUser = getAuthenticatedUser();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new SecurityException("Доступ запрещён: вы не владелец проекта");
        }

        return participantRepository.findByProject(project).stream()
                .map(participant -> ParticipantResponse.builder()
                        .id(participant.getId())
                        .fullName(participant.getUser().getFullName())
                        .iinBin(participant.getUser().getIinBin())
                        .organization(participant.getUser().getOrganization())
                        .phone(participant.getUser().getPhone())
                        .email(participant.getUser().getEmail())
                        .role(participant.getRole())
                        .canUploadDocuments(participant.isCanUploadDocuments())
                        .canSendNotifications(participant.isCanSendNotifications())
                        .build())
                .collect(Collectors.toList());
    }

    // Возвращает список сущностей участников проекта.
    public List<Participant> getParticipantsEntitiesByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Проект не найден"));

        return participantRepository.findByProject(project);
    }

    // Обновляет информацию об участнике проекта. Доступно только владельцу проекта.
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

        return ParticipantResponse.builder()
                .id(updatedParticipant.getId())
                .fullName(updatedParticipant.getUser().getFullName())
                .iinBin(participant.getUser().getIinBin())
                .organization(updatedParticipant.getUser().getOrganization())
                .phone(updatedParticipant.getUser().getPhone())
                .email(updatedParticipant.getUser().getEmail())
                .role(updatedParticipant.getRole())
                .canUploadDocuments(updatedParticipant.isCanUploadDocuments())
                .canSendNotifications(updatedParticipant.isCanSendNotifications())
                .build();
    }

    // Удаляет участника из проекта. Доступно только владельцу проекта.
    public void removeParticipant(Long participantId) {
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Участник не найден"));

        Project project = participant.getProject();
        User currentUser = getAuthenticatedUser();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new SecurityException("Доступ запрещён: только владелец проекта может удалять участников");
        }
        // Удаляем участника из всех задач, где он был ответственным.
        List<Task> tasks = taskRepository.findByResponsiblePersonsContains(participant);
        for (Task task : tasks) {
            task.getResponsiblePersons().remove(participant);
        }
        taskRepository.saveAll(tasks);

        participantRepository.delete(participant);
    }

    // Получает аутентифицированного пользователя из контекста безопасности.
    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = principal instanceof UserDetails userDetails ? userDetails.getUsername() : principal.toString();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }
}
