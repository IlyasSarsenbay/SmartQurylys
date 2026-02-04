package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Репозиторий для работы с сущностями User.
public interface UserRepository extends JpaRepository<User, Long> {
    // Находит пользователя по адресу электронной почты.
    Optional<User> findByEmail(String email);
    // Находит пользователя по номеру телефона.
    Optional<User> findByPhone(String phone);
    // Находит пользователя по ИИН/БИН.
    Optional<User> findByIinBin(String iin);
}