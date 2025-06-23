package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.user.email.ChangeEmailRequest;
import com.smartqurylys.backend.dto.user.ChangePasswordRequest;
import com.smartqurylys.backend.dto.auth.RegisterRequest;
import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.entity.City;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.CityRepository;
import com.smartqurylys.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final PasswordEncoder passwordEncoder;
    private final PhoneService phoneService;
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

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getOrganization(),
                user.getIinBin(),
                user.getCity() != null ? user.getCity().getName() : null
        );
    }

    public UserResponse updateUser(Long userId, RegisterRequest updateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

//        if (!phoneService.isPhoneVerified(updateRequest.getPhone())&&!updateRequest.getPhone().equals(user.getPhone())) {
//            throw new IllegalArgumentException("Номер не подтвержден");
//        }
        if (!emailService.isEmailVerified(updateRequest.getEmail())&&!updateRequest.getEmail().equals(user.getEmail())) {
            throw new IllegalArgumentException("Почта не подтверждена");
        }
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
        user.setOrganization(updateRequest.getOrganization());
        user.setIinBin(updateRequest.getIinBin());

        if (updateRequest.getCityId() != null) {
            City city = cityRepository.findById(updateRequest.getCityId())
                    .orElseThrow(() -> new IllegalArgumentException("Город не найден"));
            user.setCity(city);
        }



        User updatedUser = userRepository.save(user);

        return new UserResponse(
                updatedUser.getId(),
                updatedUser.getFullName(),
                updatedUser.getEmail(),
                updatedUser.getPhone(),
                updatedUser.getOrganization(),
                updatedUser.getIinBin(),
                updatedUser.getCity() != null ? updatedUser.getCity().getName() : null
        );
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

        return new UserResponse(
                updatedUser.getId(),
                updatedUser.getFullName(),
                updatedUser.getEmail(),
                updatedUser.getPhone(),
                updatedUser.getOrganization(),
                updatedUser.getIinBin(),
                updatedUser.getCity() != null ? updatedUser.getCity().getName() : null
        );
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


}
