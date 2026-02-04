package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Conversation;
import com.smartqurylys.backend.shared.enums.ConversationType;
import com.smartqurylys.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// Репозиторий для работы с сущностями Conversation.
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    // Ищет беседу по типу и идентификатору проекта.
    Optional<Conversation> findByTypeAndProjectId(ConversationType type, Long projectId);

    // Находит личную беседу между двумя указанными пользователями.
    @Query("SELECT c FROM Conversation c JOIN c.participants p " + // Объединяем с коллекцией participants.
            "WHERE c.type = 'PRIVATE_CHAT' AND p IN (:user1, :user2) " + // Проверяем, что оба пользователя являются участниками.
            "GROUP BY c HAVING COUNT(p) = 2 AND SUM(CASE WHEN p = :user1 THEN 1 ELSE 0 END) = 1 AND SUM(CASE WHEN p = :user2 THEN 1 ELSE 0 END) = 1") // Проверяем, что участвуют именно эти 2 пользователя и ровно 2.
    Optional<Conversation> findPrivateChatBetweenUsers(User user1, User user2);

    // Находит все беседы, в которых участвует данный пользователь, отсортированные по времени последнего сообщения.
    // Включает как личные чаты (через participants), так и чаты проектов (через участников проекта или владельца).
    @Query("SELECT DISTINCT c FROM Conversation c " +
            "LEFT JOIN FETCH c.project pr " +
            "LEFT JOIN FETCH pr.participants prp " +
            "LEFT JOIN c.participants p " +
            "LEFT JOIN pr.participants pp " +
            "WHERE (c.type = 'PRIVATE_CHAT' AND p = :user) " +
            "OR (c.type = 'PROJECT_CHAT' AND (pp.user = :user OR pr.owner = :user)) " +
            "ORDER BY c.lastMessageTimestamp DESC")
    List<Conversation> findUserConversations(User user);
}