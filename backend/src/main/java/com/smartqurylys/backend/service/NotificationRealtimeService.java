package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.realtime.NotificationRealtimeEvent;
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
public class NotificationRealtimeService {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(Long userId, String type, Long notificationId) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send(userId, type, notificationId);
                }
            });
            return;
        }

        send(userId, type, notificationId);
    }

    private void send(Long userId, String type, Long notificationId) {
        log.info("Publishing notification realtime event: userId={}, type={}, notificationId={}",
                userId, type, notificationId);

        messagingTemplate.convertAndSend(
                "/topic/notifications/" + userId + "/updates",
                NotificationRealtimeEvent.builder()
                        .userId(userId)
                        .type(type)
                        .notificationId(notificationId)
                        .occurredAt(LocalDateTime.now())
                        .build()
        );
    }
}
