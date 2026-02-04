package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.participant.ParticipantResponse;
import com.smartqurylys.backend.dto.project.participant.UpdateParticipantRequest;
import com.smartqurylys.backend.service.ParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Контроллер для управления участниками проекта.
@RestController
@RequestMapping("/api/participants")
@RequiredArgsConstructor
public class ParticipantController {

    private final ParticipantService participantService;

    // Получение списка участников для указанного проекта.
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ParticipantResponse>> getParticipants(@PathVariable Long projectId) {
        return ResponseEntity.ok(participantService.getParticipantsByProject(projectId));
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
