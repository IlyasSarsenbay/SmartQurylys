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

@Entity
@Table(name = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Тип беседы: PROJECT_CHAT (для проекта), PRIVATE_CHAT (для личного сообщения)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConversationType type;

    // Для PROJECT_CHAT: ссылка на проект. Nullable для PRIVATE_CHAT.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    // Для PRIVATE_CHAT: название беседы (например, "Иванов И.И. & Петров П.П.")
    // Для PROJECT_CHAT: может быть null или "Чат проекта"
    private String name;

    // Для PRIVATE_CHAT: участники беседы (обычно 2).
    // Для PROJECT_CHAT: участники определяются через Project.participants, это поле не используется.
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "conversation_participants",
            joinColumns = @JoinColumn(name = "conversation_id"),
            inverseJoinColumns = @JoinColumn(name = "participant_id")
    )
    private Set<User> participants = new HashSet<>(); // Используем User, т.к. Participant - это User в контексте проекта

    private LocalDateTime lastMessageTimestamp;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ChatMessage> chatMessages = new ArrayList<>();
}