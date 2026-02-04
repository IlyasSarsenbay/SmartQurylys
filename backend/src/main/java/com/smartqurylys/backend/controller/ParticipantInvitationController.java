package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.service.ParticipantInvitationService;
import com.smartqurylys.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Контроллер для обработки приглашений в проекты.
@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class ParticipantInvitationController {

    private final ParticipantInvitationService invitationService;
    private final UserService userService;

    // Принятие приглашения.
    @PostMapping("/{invitationId}/accept")
    public ResponseEntity<Void> accept(@PathVariable Long invitationId) {
        User user = userService.getCurrentUserEntity();
        invitationService.acceptInvitation(invitationId, user);
        return ResponseEntity.ok().build();
    }

    // Отклонение приглашения.
    @PostMapping("/{invitationId}/decline")
    public ResponseEntity<Void> decline(@PathVariable Long invitationId) {
        User user = userService.getCurrentUserEntity();
        invitationService.declineInvitation(invitationId, user);
        return ResponseEntity.noContent().build();
    }
}
