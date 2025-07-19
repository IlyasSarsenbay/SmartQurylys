package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.user.email.ChangeEmailRequest;
import com.smartqurylys.backend.dto.user.ChangePasswordRequest;
import com.smartqurylys.backend.dto.auth.RegisterRequest;
import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.entity.City;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.CityRepository;
import com.smartqurylys.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final PasswordEncoder passwordEncoder;
//    private final PhoneService phoneService;
    private final EmailService emailService;

    public UserResponse getCurrentUserInfo() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        String email;
        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {
            email = principal.toString();
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        return mapToUserResponse(user);
    }

    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден с ID: " + userId));
        return mapToUserResponse(user);
    }

    public UserResponse updateUser(Long userId, RegisterRequest updateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        User currentUser = getAuthenticatedUser();

//        if (!phoneService.isPhoneVerified(updateRequest.getPhone())&&!updateRequest.getPhone().equals(user.getPhone())) {
//            throw new IllegalArgumentException("Номер не подтвержден");
//        }
        boolean isAdmin = currentUser.getRole().equals("ADMIN");

        userRepository.findByIinBin(updateRequest.getIinBin()).ifPresent(otherUser -> {
            if (!otherUser.getId().equals(userId)) {
                throw new IllegalArgumentException("ИИН/БИН уже используется другим пользователем");
            }
        });

        userRepository.findByPhone(updateRequest.getPhone()).ifPresent(otherUser -> {
            if (!otherUser.getId().equals(userId)) {
                throw new IllegalArgumentException("Телефон уже используется другим пользователем");
            }
        });

        user.setFullName(updateRequest.getFullName());
        user.setPhone(updateRequest.getPhone());
        user.setIinBin(updateRequest.getIinBin());
        if (isAdmin) {
            user.setEmail(updateRequest.getEmail());
        }

        if (updateRequest.getCityId() != null) {
            City city = cityRepository.findById(updateRequest.getCityId())
                    .orElseThrow(() -> new IllegalArgumentException("Город не найден"));
            user.setCity(city);
        }



        User updatedUser = userRepository.save(user);

        return mapToUserResponse(updatedUser);
    }


    public UserResponse changeEmail(ChangeEmailRequest request) {
        String currentEmail = getAuthenticatedEmail();

        if (userRepository.findByEmail(request.getNewEmail()).isPresent()) {
            throw new IllegalArgumentException("Почта уже используется");
        }

        if (!emailService.isEmailVerified(request.getNewEmail())) {
            throw new IllegalArgumentException("Почта не потдверждена");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        user.setEmail(request.getNewEmail());
        User updatedUser = userRepository.save(user);

        return mapToUserResponse(updatedUser);
    }

    public void changePassword(ChangePasswordRequest request) {
        String email = getAuthenticatedEmail();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Нынешний пароль не верен");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private User getAuthenticatedUser() {
        String email = getAuthenticatedEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    private String getAuthenticatedEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        } else {
            return principal.toString();
        }

    }

    public User getCurrentUserEntity() {
        String email = getAuthenticatedEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    public UserResponse createUser(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этой почтой уже существует");
        }
        if (userRepository.findByIinBin(request.getIinBin()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этим ИИН или БИН уже существует");
        }
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этим телефоном уже существует");
        }

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new EntityNotFoundException("Город не найден"));

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(hashedPassword)
                .phone(request.getPhone())
                .iinBin(request.getIinBin())
                .city(city)
                .role("USER")
                .build();

        User savedUser = userRepository.save(user);

        return mapToUserResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }
    @Transactional
    public UserResponse updateUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (!newRole.equals("USER") && !newRole.equals("ADMIN")) { // Добавьте другие роли, если есть
            throw new IllegalArgumentException("Недопустимая роль: " + newRole);
        }

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);

        return mapToUserResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("Пользователь не найден с ID: " + userId);
        }
        userRepository.deleteById(userId);
    }



    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .iinBin(user.getIinBin())
                .city(user.getCity() != null ? user.getCity().getName() : null)
                .build();
    }




}
