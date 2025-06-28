package com.smartqurylys.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
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

    // Getters and Setters (click Right-click > Generate > Getter/Setter)
}
