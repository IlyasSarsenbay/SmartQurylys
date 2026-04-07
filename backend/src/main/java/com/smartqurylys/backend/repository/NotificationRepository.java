package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Notification;
import com.smartqurylys.backend.entity.NotificationType;
import com.smartqurylys.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// Репозиторий для работы с сущностями Notification.
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Находит все уведомления для указанного получателя, отсортированные по дате создания (от новых к старым).
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    // Отмечает все непрочитанные уведомления получателя как прочитанные.
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient = :recipient AND n.isRead = false")
    void markAllAsReadForRecipient(User recipient);
    
    // Находит уведомление по типу и идентификатору связанной сущности.
    Optional<Notification> findByTypeAndRelatedEntityId(NotificationType type, Long relatedEntityId);

    // Удаляет все уведомления, адресованные указанному получателю.
    void deleteByRecipient(User recipient);

    // Удаляет все уведомления, отправленные указанным отправителем.
    void deleteBySender(User sender);
}