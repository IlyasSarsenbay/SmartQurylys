package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.participant.ParticipantResponse;
import com.smartqurylys.backend.dto.project.participant.UpdateParticipantRequest;
import com.smartqurylys.backend.entity.ParticipantInvitation;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.service.ParticipantInvitationService;
import com.smartqurylys.backend.service.ParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

// Контроллер для управления участниками проекта.
@RestController
@RequestMapping("/api/participants")
@RequiredArgsConstructor
public class ParticipantController {

    private final ParticipantService participantService;
        private final ParticipantInvitationService invitationService;

    // Получение списка участников для указанного проекта.
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ParticipantResponse>> getParticipants(@PathVariable Long projectId) {
        return ResponseEntity.ok(participantService.getParticipantsByProject(projectId));
    }


    @GetMapping("/project/{id}/invitations")
    public ResponseEntity<List<ParticipantResponse>> getInvitedParticipants(@PathVariable Long id) {
        try {
            ArrayList<ParticipantResponse> result = new ArrayList<>();
            List<ParticipantInvitation> invitations = invitationService.getInvitationsByProject(id);
            for (var invitation : invitations) {
                User user = invitation.getUser();

                ParticipantResponse response = ParticipantResponse.builder()
                        .id(invitation.getId())
                        .userId(user.getId())
                        .fullName(user.getFullName())
                        .iinBin(user.getIinBin())
                        .role(invitation.getRole())
                        .organization(user.getOrganization())
                        .phone(user.getPhone())
                        .email(user.getEmail())
                        .canUploadDocuments(invitation.isCanUploadDocuments())
                        .canSendNotifications(invitation.isCanSendNotifications())
                        .owner(false)
                        .build();

                result.add(response);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Частичное обновление данных участника (например, роли).
    @PatchMapping("/{participantId}")
    public ResponseEntity<ParticipantResponse> updateParticipant(
            @PathVariable Long participantId,
            @RequestBody UpdateParticipantRequest request) {
        ParticipantResponse updatedParticipant = participantService.updateParticipant(participantId, request);
        return ResponseEntity.ok(updatedParticipant);
    }

    // Удаление участника из проекта.
    @DeleteMapping("/{participantId}")
    public ResponseEntity<Void> deleteParticipant(@PathVariable Long participantId) {
        participantService.removeParticipant(participantId);
        return ResponseEntity.noContent().build();
    }
}
