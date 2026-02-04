package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.ChatMessage;
import com.smartqurylys.backend.entity.Conversation; // Используем Conversation для связи, а не Project.
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// Репозиторий для работы с сущностями ChatMessage.
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // Находит все сообщения для заданной беседы, отсортированные по времени отправки в возрастающем порядке.
    List<ChatMessage> findByConversationOrderByTimestampAsc(Conversation conversation);

    List<ChatMessage> findBySender(com.smartqurylys.backend.entity.User sender);
    void deleteBySender(com.smartqurylys.backend.entity.User sender);
}