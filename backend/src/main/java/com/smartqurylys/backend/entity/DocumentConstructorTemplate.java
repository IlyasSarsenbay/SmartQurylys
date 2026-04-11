package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "document_constructor_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentConstructorTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String code;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 120)
    private String category;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer version;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "is_system", nullable = false)
    private boolean system;

    @Column(name = "schema_json", nullable = false, columnDefinition = "text")
    private String schemaJson;

    @Column(name = "layout_json", nullable = false, columnDefinition = "text")
    private String layoutJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
