package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.realtime.ProjectRealtimeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProjectRealtimeService {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(Long projectId, String type, Long entityId) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send(projectId, type, entityId);
                }
            });
            return;
        }

        send(projectId, type, entityId);
    }

    private void send(Long projectId, String type, Long entityId) {
        log.info("Publishing project realtime event: projectId={}, type={}, entityId={}", projectId, type, entityId);
        messagingTemplate.convertAndSend(
            "/topic/projects/" + projectId + "/updates",
            ProjectRealtimeEvent.builder()
                .projectId(projectId)
                .type(type)
                .entityId(entityId)
                .occurredAt(LocalDateTime.now())
                .build()
        );
    }
}
