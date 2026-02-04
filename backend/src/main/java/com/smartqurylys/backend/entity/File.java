package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

// Сущность для представления файла в системе.
@Entity
@Table(name = "files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "file_type", discriminatorType = DiscriminatorType.STRING)
@DiscriminatorValue("FILE")
public class File {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор файла.

    private String name; // Имя файла.

    private String filepath; // Путь к файлу на сервере.

    private Long size; // Размер файла в байтах.

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // Пользователь, загрузивший файл.

    @Column(name = "created_at")
    private LocalDateTime createdAt; // Дата и время загрузки файла.
}