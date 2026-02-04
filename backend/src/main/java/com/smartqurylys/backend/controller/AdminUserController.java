package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.auth.RegisterRequest;
import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.dto.user.organisation.OrganisationCreateRequest;
import com.smartqurylys.backend.dto.user.organisation.OrganisationResponse;
import com.smartqurylys.backend.service.OrganisationService;
import com.smartqurylys.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Контроллер для администрирования пользователей. Доступ только для администраторов.
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final OrganisationService organisationService;

    // Создание нового пользователя.
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody RegisterRequest request) {
            UserResponse response = userService.createUser(request);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Получение списка всех пользователей.
    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // Получение пользователя по ID.
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long userId) {
            UserResponse user = userService.getUserById(userId);
            return ResponseEntity.ok(user);
    }

    // Получение роли пользователя по ID.
    @GetMapping("/{userId}/role")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<String> getUserRole(@PathVariable Long userId) {
        String role = userService.getUserRole(userId);
        return ResponseEntity.ok(role);
    }

    // Обновление роли пользователя.
    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> updateUserRole(@PathVariable Long userId, @RequestBody String newRole) {
            UserResponse updatedUser = userService.updateUserRole(userId, newRole);
            return ResponseEntity.ok(updatedUser);
    }

    // Обновление данных пользователя.
    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long userId, @RequestBody RegisterRequest request) {
            UserResponse updatedUser = userService.updateUser(userId, request);
            return ResponseEntity.ok(updatedUser);
    }

    // Удаление пользователя.
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}