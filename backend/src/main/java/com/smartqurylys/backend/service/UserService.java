package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.user.email.ChangeEmailRequest;
import com.smartqurylys.backend.dto.user.ChangePasswordRequest;
import com.smartqurylys.backend.dto.auth.RegisterRequest;
import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.entity.City;
import com.smartqurylys.backend.entity.Organisation;
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

// Сервис для управления учетными записями пользователей: получение, обновление, изменение пароля и email, а также административные операции.
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final PasswordEncoder passwordEncoder;
//    private final PhoneService phoneService; // Закомментировано, возможно, временно.
    private final EmailService emailService;

    // Получает информацию о текущем аутентифицированном пользователе.
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

    // Получает информацию о пользователе по его ID.
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден с ID: " + userId));
        return mapToUserResponse(user);
    }

    // Получает роль пользователя по его ID.
    public String getUserRole(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден с ID: " + userId));
        return user.getRole();
    }

    // Обновляет информацию о пользователе. Проверяет уникальность ИИН/БИН и телефона.
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
            user.setEmail(updateRequest.getEmail()); // Администратор может менять email пользователя.
        }

        if (updateRequest.getCityId() != null) {
            City city = cityRepository.findById(updateRequest.getCityId())
                    .orElseThrow(() -> new IllegalArgumentException("Город не найден"));
            user.setCity(city);
        }

        User updatedUser = userRepository.save(user);

        return mapToUserResponse(updatedUser);
    }

    // Обновляет информацию о пользователе (для администраторов, через ID).
    public UserResponse updateUser(Long userId, com.smartqurylys.backend.dto.user.UpdateUserRequest updateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        if (updateRequest.getFullName() != null) user.setFullName(updateRequest.getFullName());
        if (updateRequest.getPhone() != null) user.setPhone(updateRequest.getPhone());
        if (updateRequest.getIinBin() != null) user.setIinBin(updateRequest.getIinBin());
        
        if (updateRequest.getCityId() != null) {
            City city = cityRepository.findById(updateRequest.getCityId())
                    .orElseThrow(() -> new EntityNotFoundException("Город не найден"));
            user.setCity(city);
        }

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    // Изменяет адрес электронной почты текущего пользователя.
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

    // Изменяет пароль текущего пользователя.
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

    // Вспомогательный метод для получения аутентифицированного пользователя.
    private User getAuthenticatedUser() {
        String email = getAuthenticatedEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    // Вспомогательный метод для получения email аутентифицированного пользователя.
    private String getAuthenticatedEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        } else {
            return principal.toString();
        }
    }

    // Получает сущность текущего аутентифицированного пользователя.
    public User getCurrentUserEntity() {
        String email = getAuthenticatedEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    // Создает нового пользователя (используется, например, администратором).
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

    // Получает список всех пользователей.
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    // Обновляет роль пользователя (административная функция).
    @Transactional
    public UserResponse updateUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (!newRole.equals("USER") && !newRole.equals("ADMIN")) { // Добавьте другие роли, если есть.
            throw new IllegalArgumentException("Недопустимая роль: " + newRole);
        }

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);

        return mapToUserResponse(updatedUser);
    }

    // Удаляет пользователя по его ID.
    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("Пользователь не найден с ID: " + userId);
        }
        userRepository.deleteById(userId);
    }
    
    // Поиск пользователей по имени или почте (исключая текущего пользователя).
    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String query) {
        User currentUser = getCurrentUserEntity();
        return userRepository.findAll().stream()
                .filter(user -> !user.getId().equals(currentUser.getId()))
                .filter(user -> (user.getFullName() != null && user.getFullName().toLowerCase().contains(query.toLowerCase())) ||
                                (user.getEmail() != null && user.getEmail().toLowerCase().contains(query.toLowerCase())))
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    // Преобразует сущность User в DTO UserResponse.
    UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .iinBin(user.getIinBin())
                .city(user.getCity() != null ? user.getCity().getName() : null)
                .organization(user.getOrganization())
                .role(user.getRole())
                .userType(user instanceof Organisation ? "ORGANISATION" : "USER") // Populate userType
                .build();
    }
}
