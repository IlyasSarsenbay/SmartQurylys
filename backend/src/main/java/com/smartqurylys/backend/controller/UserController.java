package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.user.email.ChangeEmailRequest;
import com.smartqurylys.backend.dto.user.ChangePasswordRequest;
import com.smartqurylys.backend.dto.auth.RegisterRequest;
import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.dto.user.UpdateUserRequest;
import com.smartqurylys.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// Контроллер для управления данными пользователя.
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Получение информации о текущем аутентифицированном пользователе.
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUserInfo());
    }

    // Обновление информации о текущем пользователе.
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(@Valid @RequestBody RegisterRequest request) {
        Long currentUserId = userService.getCurrentUserInfo().getId();
        return ResponseEntity.ok(userService.updateUser(currentUserId, request));
    }

    // Обновление информации о пользователе по ID (только для администраторов).
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    // Изменение адреса электронной почты пользователя.
    @PatchMapping("/change-email")
    public ResponseEntity<UserResponse> changeEmail(@Valid @RequestBody ChangeEmailRequest request) {
        UserResponse updatedUser = userService.changeEmail(request);
        return ResponseEntity.ok(updatedUser);
    }

    // Изменение пароля пользователя.
    @PatchMapping("/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok("Пароль был успешно изменен");
    }

    // Поиск пользователей.
    @GetMapping("/search")
    public ResponseEntity<java.util.List<UserResponse>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userService.searchUsers(query));
    }
}

