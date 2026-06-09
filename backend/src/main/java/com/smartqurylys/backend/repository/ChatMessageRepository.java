package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.ChatMessage;
import com.smartqurylys.backend.entity.Conversation;
import com.smartqurylys.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

// Репозиторий для работы с сущностями ChatMessage.
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // Находит все сообщения для заданной беседы, отсортированные по времени отправки в возрастающем порядке.
    List<ChatMessage> findByConversationOrderByTimestampAsc(Conversation conversation);

    List<ChatMessage> findBySender(User sender);
    void deleteBySender(User sender);

    // Обнуляет ссылку relatedMessage в сообщениях, которые ссылаются на сообщения данного отправителя.
    // Необходимо вызывать перед deleteBySender, иначе FK на related_message_id заблокирует удаление.
    @Modifying
    @Query("UPDATE ChatMessage m SET m.relatedMessage = null WHERE m.relatedMessage IN (SELECT msg FROM ChatMessage msg WHERE msg.sender = :user)")
    void nullifyRelatedMessagesBySender(@Param("user") User user);

    // Удаляет все упоминания пользователя из join-таблицы chat_message_mentions.
    // Необходимо вызывать перед удалением пользователя, иначе FK на user_id заблокирует удаление.
    @Modifying
    @Query(value = "DELETE FROM chat_message_mentions WHERE user_id = :userId", nativeQuery = true)
    void deleteUserMentions(@Param("userId") Long userId);
}