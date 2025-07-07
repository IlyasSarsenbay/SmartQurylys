package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.DocumentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.Date;
import java.util.List;

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
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    private String name;
    private String filePath;

    @Temporal(TemporalType.TIMESTAMP)
    private Date uploadDate;

    @Enumerated(EnumType.STRING)
    private DocumentStatus status;

    // 🔹 Files attached to the document
    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "document_id")
    private List<File> files;

    // 🔹 Who must sign this document
    @ManyToMany
    @JoinTable(
            name = "document_have_to_sign",
            joinColumns = @JoinColumn(name = "document_id"),
            inverseJoinColumns = @JoinColumn(name = "participant_id")
    )
    private List<Participant> haveToSign;

    // 🔹 Who already signed it
    @ManyToMany
    @JoinTable(
            name = "document_signed",
            joinColumns = @JoinColumn(name = "document_id"),
            inverseJoinColumns = @JoinColumn(name = "participant_id")
    )
    private List<Participant> signed;

    // 🔹 Comments on the document
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments;
}
