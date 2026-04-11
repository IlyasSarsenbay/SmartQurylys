package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.documentconstructor.ConstructorDocumentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "document_constructor_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentConstructorDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private DocumentConstructorTemplate template;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User ownerUser;

    @Column(nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ConstructorDocumentStatus status;

    @Column(name = "template_name_snapshot", nullable = false, length = 255)
    private String templateNameSnapshot;

    @Column(name = "template_version_snapshot", nullable = false)
    private Integer templateVersionSnapshot;

    @Column(name = "form_data_json", nullable = false, columnDefinition = "text")
    private String formDataJson;

    @Column(name = "rendered_html", nullable = false, columnDefinition = "text")
    private String renderedHtml;

    @Column(name = "validation_errors_json", nullable = false, columnDefinition = "text")
    private String validationErrorsJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
