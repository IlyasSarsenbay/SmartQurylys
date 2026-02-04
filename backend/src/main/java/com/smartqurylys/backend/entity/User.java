package com.smartqurylys.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

// Сущность для представления пользователя в системе.
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "user_type", discriminatorType = DiscriminatorType.STRING)
@DiscriminatorValue("USER")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный идентификатор пользователя.

    private String fullName; // Полное имя пользователя.

    @Column(unique = true, nullable = false)
    private String email; // Адрес электронной почты пользователя.

    private String password; // Хэшированный пароль пользователя.

    @Column(unique = true, nullable = false)
    private String phone; // Номер телефона пользователя.

    @Column(unique = true, nullable = false)
    private String iinBin; // ИИН/БИН пользователя.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city; // Город проживания пользователя.

    @Column(nullable = false)
    private String role; // Роль пользователя (например, ADMIN, USER).

    private String organization; // Организация пользователя.
}


