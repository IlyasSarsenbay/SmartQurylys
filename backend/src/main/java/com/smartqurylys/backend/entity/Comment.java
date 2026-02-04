package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// Сущность для хранения комментариев к документам.
@Entity
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор комментария.

    private String author; // Автор комментария.
    private String text; // Текст комментария.
    private LocalDateTime timestamp = LocalDateTime.now(); // Дата и время создания комментария.

    @ManyToOne
    @JoinColumn(name = "document_id")
    private Document document; // Документ, к которому относится комментарий.
}
