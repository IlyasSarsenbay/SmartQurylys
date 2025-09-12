package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.auth.AuthResponse;
import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.dto.project.LicenseResponse;
import com.smartqurylys.backend.dto.user.organisation.LicenseUpdateRequest;
import com.smartqurylys.backend.dto.user.organisation.OrganisationCreateRequest;
import com.smartqurylys.backend.dto.user.organisation.OrganisationResponse;
import com.smartqurylys.backend.dto.user.organisation.OrganisationUpdateRequest;
import com.smartqurylys.backend.entity.*;
import com.smartqurylys.backend.repository.CityRepository;
import com.smartqurylys.backend.repository.LicenseRepository;
import com.smartqurylys.backend.repository.OrganisationRepository;
import com.smartqurylys.backend.repository.UserRepository;
import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import com.smartqurylys.backend.shared.enums.Specialization;
import com.smartqurylys.backend.shared.utils.JwtUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrganisationService {

    private final OrganisationRepository organisationRepository;
    private final CityRepository cityRepository;
    private final LicenseRepository licenseRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final UserService userService;
    private final EmailService mailService;
    private final PhoneService phoneService;
    private final JwtUtils jwtUtils;
    private final FileService fileService;

    @Transactional
    public AuthResponse createOrganisation(OrganisationCreateRequest request) {
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
            throw new IllegalArgumentException("Почта не подтверждена");
        }

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new EntityNotFoundException("Город не найден с ID: " + request.getCityId()));

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        Set<Specialization> specializations = request.getSpecialization() != null ?
                request.getSpecialization().stream()
                        .map(s -> {
                            try {
                                return Specialization.valueOf(s.toUpperCase()); // Преобразуем строку в Enum
                            } catch (IllegalArgumentException e) {
                                throw new IllegalArgumentException("Неверное значение специализации: " + s);
                            }
                        })
                        .collect(Collectors.toSet()) :
                new HashSet<>();

        Organisation organisation = Organisation.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(hashedPassword)
                .phone(request.getPhone())
                .iinBin(request.getIinBin())
                .city(city)
                .judAddress(request.getJudAddress())
                .organization(request.getOrganization())
                .position(request.getPosition())
                .type(request.getType())
                .field(request.getField())
                .specialization(specializations)
                .yearsOfExperience(request.getYearsOfExperience())
                .role("USER")
                .build();

        Organisation savedOrganisation = organisationRepository.save(organisation);

        phoneService.removeVerifiedPhone(request.getPhone());
        String token = jwtUtils.generateToken(savedOrganisation.getEmail());

        OrganisationResponse organisationResponse = mapToResponse(savedOrganisation);

        return new AuthResponse(token, organisationResponse);
    }


    public OrganisationResponse createOrganisationByAdmin(OrganisationCreateRequest request) {
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
            throw new IllegalArgumentException("Почта не подтверждена");
        }

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new EntityNotFoundException("Город не найден с ID: " + request.getCityId()));

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        Set<Specialization> specializations = request.getSpecialization() != null ?
                request.getSpecialization().stream()
                        .map(s -> {
                            try {
                                return Specialization.valueOf(s.toUpperCase());
                            } catch (IllegalArgumentException e) {
                                throw new IllegalArgumentException("Неверное значение специализации: " + s);
                            }
                        })
                        .collect(Collectors.toSet()) :
                new HashSet<>();

        Organisation organisation = Organisation.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(hashedPassword)
                .phone(request.getPhone())
                .iinBin(request.getIinBin())
                .city(city)
                .judAddress(request.getJudAddress())
                .organization(request.getOrganization())
                .position(request.getPosition())
                .type(request.getType())
                .field(request.getField())
                .specialization(specializations)
                .yearsOfExperience(request.getYearsOfExperience())
                .build();

        Organisation savedOrganisation = organisationRepository.save(organisation);

        return mapToResponse(savedOrganisation);
    }

    public OrganisationResponse getOrganisationInfo() {
        User currentUser = userService.getCurrentUserEntity();

        if (!(currentUser instanceof Organisation organisation)) {
            throw new AccessDeniedException("Доступ запрещен: Текущий пользователь не является организацией.");
        }

        Organisation fullOrganisation = organisationRepository.findById(organisation.getId())
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + organisation.getId()));

        return mapToResponse(fullOrganisation);
    }

    @Transactional(readOnly = true)
    public OrganisationResponse getOrganisationById(Long id) {
        Organisation organisation = organisationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + id));
        return mapToResponse(organisation);
    }

    @Transactional(readOnly = true)
    public List<OrganisationResponse> getAllOrganisations() {
        return organisationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrganisationResponse updateOrganisation(Long id, OrganisationUpdateRequest request) {
        Organisation organisation = organisationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + id));

        Optional.ofNullable(request.getFullName()).ifPresent(organisation::setFullName);
        Optional.ofNullable(request.getEmail()).ifPresent(email -> {
            if (!email.equals(organisation.getEmail())) {
                userRepository.findByEmail(email).ifPresent(otherUser -> {
                    if (!otherUser.getId().equals(id)) {
                        throw new IllegalArgumentException("Почта уже используется другим пользователем");
                    }
                });
                organisation.setEmail(email);
            }
        });
        Optional.ofNullable(request.getPhone()).ifPresent(phone -> {
            if (!phone.equals(organisation.getPhone())) {
                userRepository.findByPhone(phone).ifPresent(otherUser -> {
                    if (!otherUser.getId().equals(id)) {
                        throw new IllegalArgumentException("Телефон уже используется другим пользователем");
                    }
                });
                organisation.setPhone(phone);
            }
        });
        Optional.ofNullable(request.getIinBin()).ifPresent(iinBin -> {
            if (!iinBin.equals(organisation.getIinBin())) {
                userRepository.findByIinBin(iinBin).ifPresent(otherUser -> {
                    if (!otherUser.getId().equals(id)) {
                        throw new IllegalArgumentException("ИИН/БИН уже используется другим пользователем");
                    }
                });
                organisation.setIinBin(iinBin);
            }
        });

        if (request.getCityId() != null && (organisation.getCity() == null || !organisation.getCity().getId().equals(request.getCityId()))) {
            City city = cityRepository.findById(request.getCityId())
                    .orElseThrow(() -> new EntityNotFoundException("Город не найден с ID: " + request.getCityId()));
            organisation.setCity(city);
        } else if (request.getCityId() == null && organisation.getCity() != null) {
            organisation.setCity(null);
        }

        Optional.ofNullable(request.getJudAddress()).ifPresent(organisation::setJudAddress);
        Optional.ofNullable(request.getOrganization()).ifPresent(organisation::setOrganization);
        Optional.ofNullable(request.getYearsOfExperience()).ifPresent(organisation::setYearsOfExperience);
        Optional.ofNullable(request.getPosition()).ifPresent(organisation::setPosition);
        Optional.ofNullable(request.getType()).ifPresent(organisation::setType);
        Optional.ofNullable(request.getField()).ifPresent(organisation::setField);

        Optional.ofNullable(request.getSpecialization()).ifPresent(sList -> {
            Set<Specialization> updatedSpecializations = sList.stream()
                    .map(s -> {
                        try {
                            return Specialization.valueOf(s.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            throw new IllegalArgumentException("Неверное значение специализации: " + s);
                        }
                    })
                    .collect(Collectors.toSet());
            organisation.setSpecialization(updatedSpecializations);
        });

        Organisation updatedOrganisation = organisationRepository.save(organisation);
        return mapToResponse(updatedOrganisation);
    }

    @Transactional
    public void deleteOrganisation(Long id) {
        if (!organisationRepository.existsById(id)) {
            throw new EntityNotFoundException("Организация не найдена: " + id);
        }
        organisationRepository.deleteById(id);
    }

    public void addFileToOrganisation(Long id, MultipartFile file) throws IOException {
        Organisation organisation = organisationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + id));


        File savedFile = fileService.prepareFile(file, organisation);

        if (organisation.getFiles() == null) {
            organisation.setFiles(new ArrayList<>());
        }

        organisation.getFiles().add(savedFile);
        organisationRepository.save(organisation);
    }

    public List<FileResponse> getFilesByOrganisation(Long id) {
        Organisation organisation = organisationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + id));

        return organisation.getFiles().stream()
                .map(fileService::mapToFileResponse) // <-- Используем mapToFileResponse из FileService
                .collect(Collectors.toList());
    }

    @Transactional
    public LicenseResponse addLicenseToOrganisation(Long organisationId, MultipartFile multipartFile, String licenseCategoryDisplay) throws IOException {
        Organisation organisation = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + organisationId));

        License license = License.builder()
                .name(multipartFile.getOriginalFilename())
                .filepath(fileService.prepareFile(multipartFile,organisation).getFilepath()) // Сохраняем файл и получаем путь
                .size(multipartFile.getSize())
                .createdAt(LocalDateTime.now())
                .licenseCategoryDisplay(licenseCategoryDisplay)
                .reviewStatus(FileReviewStatus.PENDING_REVIEW)
                .user(organisation)
                .build();

        if (organisation.getLicenses() == null) {
            organisation.setLicenses(new ArrayList<>());
        }
        organisation.getLicenses().add(license);

        organisationRepository.save(organisation);

        return mapToLicenseResponse(license);
    }

    @Transactional(readOnly = true)
    public List<LicenseResponse> getLicensesByOrganisation(Long organisationId) {
        return licenseRepository.findByOrganisationId(organisationId).stream()
                .map(this::mapToLicenseResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LicenseResponse updateLicense(Long id, LicenseUpdateRequest request) {
        License license = licenseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Лицензия не найдена: " + id));

        Optional.ofNullable(request.getName()).ifPresent(license::setName);
        Optional.ofNullable(request.getLicenseCategoryDisplay()).ifPresent(license::setLicenseCategoryDisplay);
        Optional.ofNullable(request.getReviewStatus()).ifPresent(license::setReviewStatus);

        License updatedLicense = licenseRepository.save(license);
        return mapToLicenseResponse(updatedLicense);
    }

    private OrganisationResponse mapToResponse(Organisation organisation) {
        OrganisationResponse.OrganisationResponseBuilder<?, ?> builder = OrganisationResponse.builder()
                // Поля UserResponse
                .id(organisation.getId())
                .fullName(organisation.getFullName())
                .email(organisation.getEmail())
                .phone(organisation.getPhone())
                .iinBin(organisation.getIinBin())
                .city(organisation.getCity() != null ? organisation.getCity().getName() : null)

                // Поля OrganisationResponse
                .judAddress(organisation.getJudAddress())
                .organization(organisation.getOrganization())
                .position(organisation.getPosition())
                .type(organisation.getType())
                .field(organisation.getField())
                .yearsOfExperience(organisation.getYearsOfExperience());
        if (organisation.getSpecialization() != null) {
            builder.specialization(organisation.getSpecialization().stream()
                    .map(Enum::name)
                    .collect(Collectors.toList()));
        } else {
            builder.specialization(new ArrayList<>());
        }


        return builder.build();
    }

    private LicenseResponse mapToLicenseResponse(License license) {
        return LicenseResponse.builder()
                .id(license.getId())
                .name(license.getName())
                .filepath(license.getFilepath())
                .size(license.getSize())
                .createdAt(license.getCreatedAt())
                .creatorIinBin(license.getUser() != null ? license.getUser().getIinBin() : null)
                .licenseCategoryDisplay(license.getLicenseCategoryDisplay())
                .reviewStatus(license.getReviewStatus())
                .build();
    }
}