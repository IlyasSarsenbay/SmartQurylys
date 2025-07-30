package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.ChatMessage;
import com.smartqurylys.backend.entity.Conversation; // Используем Conversation, а не Project
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversationOrderByTimestampAsc(Conversation conversation);
}