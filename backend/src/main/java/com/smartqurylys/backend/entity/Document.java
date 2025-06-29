package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.DocumentStatus;
import jakarta.persistence.*;
import java.util.Date;

import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String filePath;

    @Temporal(TemporalType.TIMESTAMP)
    private Date uploadDate;

    @Enumerated(EnumType.STRING)
    private DocumentStatus status;

}
