package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Notification;
import com.smartqurylys.backend.entity.NotificationType;
import com.smartqurylys.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient = :recipient AND n.isRead = false")
    void markAllAsReadForRecipient(User recipient);
    
    Optional<Notification> findByTypeAndRelatedEntityId(NotificationType type, Long relatedEntityId);

    void deleteByRecipient(User recipient);
    void deleteBySender(User sender);
}