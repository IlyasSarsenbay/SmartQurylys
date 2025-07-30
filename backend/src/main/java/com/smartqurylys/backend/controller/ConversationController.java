package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.chat.ConversationResponse;
import com.smartqurylys.backend.dto.chat.CreatePrivateConversationRequest; // <-- ИМПОРТ НОВОГО DTO
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.service.ConversationService;
import com.smartqurylys.backend.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final UserService userService;

    @PostMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<ConversationResponse> createProjectConversation(@PathVariable Long projectId) {
        try {
            ConversationResponse response = conversationService.getOrCreateProjectChat(projectId);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PostMapping("/private")
    @PreAuthorize("hasAnyRole('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<ConversationResponse> createPrivateConversation(@Valid @RequestBody CreatePrivateConversationRequest request) { // <-- ИСПОЛЬЗУЕМ НОВЫЙ DTO
        try {
            User currentUser = userService.getCurrentUserEntity();

            ConversationResponse response = conversationService.getOrCreatePrivateChat(currentUser.getId(), request.getTargetUserId());
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<List<ConversationResponse>> getMyConversations() {
        List<ConversationResponse> conversations = conversationService.getUserConversations();
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/{conversationId}")
    @PreAuthorize("hasAnyRole('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<ConversationResponse> getConversationById(@PathVariable Long conversationId) {
        try {
            ConversationResponse response = conversationService.getConversationById(conversationId);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}