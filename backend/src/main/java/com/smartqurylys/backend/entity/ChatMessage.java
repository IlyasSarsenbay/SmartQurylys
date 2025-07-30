package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.AcknowledgementStatus;
import com.smartqurylys.backend.shared.enums.CoordinationStatus;
import com.smartqurylys.backend.shared.enums.MessageType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    @JsonIgnore
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(columnDefinition = "TEXT")
    private String content;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "attached_file_id")
    private File attachedFile;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Тип сообщения (TEXT, COORDINATION_REQUEST, ACKNOWLEDGEMENT_REQUEST, COORDINATION_RESPONSE, ACKNOWLEDGEMENT_RESPONSE, SYSTEM_ACTION)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType messageType;

    // Для сообщений типа COORDINATION_REQUEST или ACKNOWLEDGEMENT_REQUEST:
    // Участники, которых нужно отметить в сообщении (для @упоминаний)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "chat_message_mentions",
            joinColumns = @JoinColumn(name = "message_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> mentionedUsers = new HashSet<>(); // Отмеченные пользователи

    // Для COORDINATION_REQUEST: статус согласования
    @Enumerated(EnumType.STRING)
    private CoordinationStatus coordinationStatus;

    // Для ACKNOWLEDGEMENT_REQUEST: статус ознакомления
    @Enumerated(EnumType.STRING)
    private AcknowledgementStatus acknowledgementStatus;

    // Если это ответ на другое сообщение (например, "согласовал смету" на "прошу согласовать смету")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_message_id")
    @JsonIgnore
    private ChatMessage relatedMessage;

    // Дополнительные метаданные в формате JSON (например, имя сметы для согласования)
    @JdbcTypeCode(SqlTypes.JSON)
    private String metaData;



}