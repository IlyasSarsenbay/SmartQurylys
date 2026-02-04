package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.DocumentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.Date;
import java.util.List;

// Сущность для представления документа в системе.
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // Уникальный идентификатор документа.

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project; // Проект, к которому относится документ.

    private String name; // Название документа.
    private String filePath; // Путь к файлу документа на сервере.

    @Temporal(TemporalType.TIMESTAMP)
    private Date uploadDate; // Дата и время загрузки документа.

    @Enumerated(EnumType.STRING)
    private DocumentStatus status; // Текущий статус документа.

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "document_id")
    private List<File> files; // Прикрепленные к документу файлы.

    @ManyToMany
    @JoinTable(
            name = "document_have_to_sign",
            joinColumns = @JoinColumn(name = "document_id"),
            inverseJoinColumns = @JoinColumn(name = "participant_id")
    )
    private List<Participant> haveToSign; // Список участников, которым предстоит подписать документ.

    @ManyToMany
    @JoinTable(
            name = "document_signed",
            joinColumns = @JoinColumn(name = "document_id"),
            inverseJoinColumns = @JoinColumn(name = "participant_id")
    )
    private List<Participant> signed; // Список участников, уже подписавших документ.

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments; // Комментарии к документу.
}
