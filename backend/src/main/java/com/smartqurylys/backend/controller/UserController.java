package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.user.email.ChangeEmailRequest;
import com.smartqurylys.backend.dto.user.ChangePasswordRequest;
import com.smartqurylys.backend.dto.auth.RegisterRequest;
import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUserInfo());
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(@Valid @RequestBody RegisterRequest request) {
        Long currentUserId = userService.getCurrentUserInfo().getId();
        return ResponseEntity.ok(userService.updateUser(currentUserId, request));
    }

    @PatchMapping("/change-email")
    public ResponseEntity<UserResponse> changeEmail(@Valid @RequestBody ChangeEmailRequest request) {
        UserResponse updatedUser = userService.changeEmail(request);
        return ResponseEntity.ok(updatedUser);
    }

    @PatchMapping("/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok("Пароль был успешно изменен");
    }


}

