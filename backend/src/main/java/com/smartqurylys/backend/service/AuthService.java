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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final PhoneService phoneService;
    private final EmailService mailService;

    public AuthResponse registerAndAuthenticate(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этой почтой уже существует");
        }
        if (userRepository.findByIinBin(request.getIinBin()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этим ИИН или БИН уже существует");
        }

        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этим телефоном уже существует");
        }

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
        phoneService.removeVerifiedPhone(request.getPhone());
        String token = jwtUtils.generateToken(savedUser.getEmail());

        UserResponse userResponse = new UserResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getIinBin(),
                savedUser.getCity().getName()
        );

        return new AuthResponse(token, userResponse);
    }

    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Неверный пароль");
        }

        return jwtUtils.generateToken(user.getEmail());
    }
}
