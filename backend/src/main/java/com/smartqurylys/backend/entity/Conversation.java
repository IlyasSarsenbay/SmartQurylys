package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.ConversationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// Сущность для представления беседы в чате.
@Entity
@Table(name = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор беседы.

    // Тип беседы: PROJECT_CHAT (для проекта) или PRIVATE_CHAT (для личного сообщения).
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private ConversationType type;

    // Ссылка на проект, если это чат проекта (может быть null для личных бесед).
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    // Название беседы (например, "Иванов И.И. & Петров П.П." для личных чатов, или "Чат проекта").
    private String name;

    // Участники беседы (для личных чатов). Для чатов проекта участники определяются через Project.participants.
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "conversation_users",
            joinColumns = @JoinColumn(name = "conversation_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> participants = new HashSet<>(); // Набор пользователей, участвующих в беседе.

    private LocalDateTime lastMessageTimestamp; // Время последнего сообщения в беседе.

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ChatMessage> chatMessages = new ArrayList<>(); // Список сообщений в данной беседе.
}