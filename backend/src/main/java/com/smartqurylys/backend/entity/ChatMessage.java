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

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type")
    private MessageType messageType;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "chat_message_mentions",
            joinColumns = @JoinColumn(name = "message_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> mentionedUsers = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "coordination_status")
    private CoordinationStatus coordinationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "acknowledgement_status")
    private AcknowledgementStatus acknowledgementStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_message_id")
    @JsonIgnore
    private ChatMessage relatedMessage;

    @Column(name = "meta_data", columnDefinition = "text")
    private String metaData;
}