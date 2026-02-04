package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.auth.AuthResponse;
import com.smartqurylys.backend.dto.auth.LoginRequest;
import com.smartqurylys.backend.dto.auth.RegisterRequest;
import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.entity.City;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.CityRepository;
import com.smartqurylys.backend.repository.UserRepository;
import com.smartqurylys.backend.shared.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections; // Added import for Collections

// Сервис для аутентификации и регистрации пользователей.
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final PhoneService phoneService;
    private final EmailService mailService;

    // Регистрирует нового пользователя и сразу же его аутентифицирует.
    public AuthResponse registerAndAuthenticate(RegisterRequest request) {
        // Проверяем, существует ли пользователь с такой почтой, ИИН/БИН или телефоном.
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этой почтой уже существует");
        }
        if (userRepository.findByIinBin(request.getIinBin()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этим ИИН или БИН уже существует");
        }

        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этим телефоном уже существует");
        }

        // Проверяем, подтверждена ли почта.
        if (!mailService.isEmailVerified(request.getEmail())) {
            throw new IllegalArgumentException("Почта не потдверждена");
        }

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Город не найден"));

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
        phoneService.removeVerifiedPhone(request.getPhone()); // Удаляем временный код после успешной регистрации.
        // Pass roles to generateToken
        String token = jwtUtils.generateToken(savedUser.getEmail(), Collections.singletonList(savedUser.getRole()));

        UserResponse userResponse = UserResponse.builder()
                .id(savedUser.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .iinBin(savedUser.getIinBin())
                .city(savedUser.getCity().getName())
                .organization(savedUser.getOrganization())
                .role(savedUser.getRole())
                .build();

        return new AuthResponse(token, userResponse);
    }

    // Аутентифицирует пользователя и возвращает JWT-токен.
    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Неверный пароль");
        }

        // Pass roles to generateToken
        return jwtUtils.generateToken(user.getEmail(), Collections.singletonList(user.getRole()));
    }
}
