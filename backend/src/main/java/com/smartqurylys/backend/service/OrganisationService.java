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
import com.smartqurylys.backend.repository.*;
import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import com.smartqurylys.backend.shared.enums.OrganisationStatus;
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
import java.util.Collections;

// Сервис для управления операциями с организациями: регистрация, получение, обновление и удаление данных, а также работа с файлами и лицензиями.
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
    private final NotificationService notificationService;
    private final ParticipantRepository participantRepository;
    private final ParticipantInvitationRepository participantInvitationRepository;
    private final NotificationRepository notificationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ProjectNoteRepository projectNoteRepository;
    private final ProjectRepository projectRepository;
    private final FileRepository repositoryFile;
    private final ConversationRepository conversationRepository;

    // Регистрирует новую организацию и возвращает данные аутентификации.
    @Transactional
    public AuthResponse createOrganisation(OrganisationCreateRequest request) {
        // Проверяем уникальность email, ИИН/БИН и телефона.
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
            throw new IllegalArgumentException("Почта не подтверждена");
        }

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new EntityNotFoundException("Город не найден с ID: " + request.getCityId()));

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // Парсинг специализаций из строк в перечисления.
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
                .role("USER")
                .build();

        Organisation savedOrganisation = organisationRepository.save(organisation);

        phoneService.removeVerifiedPhone(request.getPhone()); // Удаляем временный код телефона после успешной регистрации.
        String token = jwtUtils.generateToken(savedOrganisation.getEmail(), Collections.singletonList(savedOrganisation.getRole()));

        OrganisationResponse organisationResponse = mapToResponse(savedOrganisation);

        return new AuthResponse(token, organisationResponse);
    }

    // Создает организацию через администратора без проверки верификации почты.
    public OrganisationResponse createOrganisationByAdmin(OrganisationCreateRequest request) {
        // Проверяем уникальность email, ИИН/БИН и телефона.
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этой почтой уже существует");
        }
        if (userRepository.findByIinBin(request.getIinBin()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этим ИИН или БИН уже существует");
        }
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с этим телефоном уже существует");
        }

        // В этом сценарии верификация почты не требуется.
//        if (!mailService.isEmailVerified(request.getEmail())) {
//            throw new IllegalArgumentException("Почта не подтверждена");
//        }

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

    // Получает информацию о текущей аутентифицированной организации.
    public OrganisationResponse getOrganisationInfo() {
        User currentUser = userService.getCurrentUserEntity();

        if (!(currentUser instanceof Organisation organisation)) {
            throw new AccessDeniedException("Доступ запрещен: Текущий пользователь не является организацией.");
        }

        Organisation fullOrganisation = organisationRepository.findById(organisation.getId())
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + organisation.getId()));

        return mapToResponse(fullOrganisation);
    }

    // Получает информацию об организации по ее ID.
    @Transactional(readOnly = true)
    public OrganisationResponse getOrganisationById(Long id) {
        Organisation organisation = organisationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + id));
        return mapToResponse(organisation);
    }

    // Получает список всех зарегистрированных организаций.
    @Transactional(readOnly = true)
    public List<OrganisationResponse> getAllOrganisations() {
        return organisationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Обновляет информацию об организации.
    @Transactional
    public OrganisationResponse updateOrganisation(Long id, OrganisationUpdateRequest request) {
        Organisation organisation = organisationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + id));

        // Обновление полей пользователя, проверяя уникальность email, телефона и ИИН/БИН.
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

        // Обновление города.
        if (request.getCityId() != null && (organisation.getCity() == null || !organisation.getCity().getId().equals(request.getCityId()))) {
            City city = cityRepository.findById(request.getCityId())
                    .orElseThrow(() -> new EntityNotFoundException("Город не найден с ID: " + request.getCityId()));
            organisation.setCity(city);
        } else if (request.getCityId() == null && organisation.getCity() != null) {
            organisation.setCity(null);
        }

        // Обновление полей организации.
        Optional.ofNullable(request.getJudAddress()).ifPresent(organisation::setJudAddress);
        Optional.ofNullable(request.getOrganization()).ifPresent(organisation::setOrganization);
        Optional.ofNullable(request.getYearsOfExperience()).ifPresent(organisation::setYearsOfExperience);
        Optional.ofNullable(request.getPosition()).ifPresent(organisation::setPosition);
        Optional.ofNullable(request.getType()).ifPresent(organisation::setType);
        Optional.ofNullable(request.getField()).ifPresent(organisation::setField);
        Optional.ofNullable(request.getStatus()).ifPresent(organisation::setStatus);

        // Обновление списка специализаций.
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

    // Удаляет организацию по ее ID.
    @Transactional
    public void deleteOrganisation(Long id) {
        Organisation organisation = organisationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + id));

        // 1. Очистка участников проектов
        participantRepository.deleteByUser(organisation);

        // 2. Очистка приглашений (как отправитель и как получатель)
        participantInvitationRepository.deleteByUser(organisation);
        participantInvitationRepository.deleteBySender(organisation);

        // 3. Очистка уведомлений (как отправитель и как получатель)
        notificationRepository.deleteByRecipient(organisation);
        notificationRepository.deleteBySender(organisation);

        // 4. Очистка сообщений чата (отправленных этой организацией)
        chatMessageRepository.deleteBySender(organisation);

        // 5. Очистка логов активности
        activityLogRepository.deleteByActor(organisation);

        // 6. Очистка заметок к проектам
        projectNoteRepository.deleteByAuthorId(organisation.getId());

        // 7. Удаление из участников бесед (ManyToMany)
        List<Conversation> conversations = conversationRepository.findUserConversations(organisation);
        for (Conversation conversation : conversations) {
            if (conversation.getParticipants() != null) {
                conversation.getParticipants().remove(organisation);
                conversationRepository.save(conversation);
            }
        }

        // 8. Обработка файлов, загруженных этой организацией в другие сущности
        List<File> uploadedFiles = repositoryFile.findByUser(organisation);
        for (File file : uploadedFiles) {
            file.setUser(null);
            repositoryFile.save(file);
        }

        // 9. Очистка проектов, владельцем которых является организация
        List<Project> ownedProjects = projectRepository.findByOwner(organisation);
        for (Project project : ownedProjects) {
            projectRepository.delete(project);
        }

        // 10. Удаление самой организации (через репозиторий организаций)
        organisationRepository.delete(organisation);
    }

    // Добавляет файл к организации.
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

    // Получает список файлов, связанных с организацией.
    public List<FileResponse> getFilesByOrganisation(Long id) {
        Organisation organisation = organisationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + id));

        return organisation.getFiles().stream()
                .map(fileService::mapToFileResponse)
                .collect(Collectors.toList());
    }

    // Добавляет лицензию к организации.
    @Transactional
    public LicenseResponse addLicenseToOrganisation(Long organisationId, MultipartFile multipartFile, String licenseCategoryDisplay) throws IOException {
        Organisation organisation = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new EntityNotFoundException("Организация не найдена: " + organisationId));

        License license = License.builder()
                .name(multipartFile.getOriginalFilename())
                .filepath(fileService.prepareFile(multipartFile,organisation).getFilepath()) // Сохраняем файл и получаем путь.
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

    // Получает список лицензий для указанной организации.
    @Transactional(readOnly = true)
    public List<LicenseResponse> getLicensesByOrganisation(Long organisationId) {
        return licenseRepository.findByOrganisationId(organisationId).stream()
                .map(this::mapToLicenseResponse)
                .collect(Collectors.toList());
    }

    // Обновляет лицензию (может включать файл, название и категорию).
    @Transactional
    public LicenseResponse updateLicenseForOrganisation(Long licenseId, MultipartFile file, String name, String licenseCategoryDisplay) throws IOException {
        License license = licenseRepository.findById(licenseId)
                .orElseThrow(() -> new EntityNotFoundException("Лицензия не найдена: " + licenseId));

        if (file != null && !file.isEmpty()) {
            license.setFilepath(fileService.prepareFile(file, license.getUser()).getFilepath());
            license.setSize(file.getSize());
            if (name == null || name.isEmpty()) {
                license.setName(file.getOriginalFilename());
            }
        }

        if (name != null && !name.isEmpty()) {
            license.setName(name);
        }
        if (licenseCategoryDisplay != null && !licenseCategoryDisplay.isEmpty()) {
            license.setLicenseCategoryDisplay(licenseCategoryDisplay);
        }

        // При любом обновлении данных лицензии со стороны организации сбрасываем статус на проверку
        license.setReviewStatus(FileReviewStatus.PENDING_REVIEW);
        license.setRejectionReason(null);

        return mapToLicenseResponse(licenseRepository.save(license));
    }

    // Обновляет информацию о лицензии.
    @Transactional
    public LicenseResponse updateLicense(Long id, LicenseUpdateRequest request) {
        License license = licenseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Лицензия не найдена: " + id));

        // Сохраняем старый статус для проверки изменений
        FileReviewStatus oldStatus = license.getReviewStatus();

        Optional.ofNullable(request.getName()).ifPresent(license::setName);
        Optional.ofNullable(request.getLicenseCategoryDisplay()).ifPresent(license::setLicenseCategoryDisplay);
        Optional.ofNullable(request.getReviewStatus()).ifPresent(license::setReviewStatus);
        Optional.ofNullable(request.getRejectionReason()).ifPresent(license::setRejectionReason);

        License updatedLicense = licenseRepository.save(license);
        
        // Отправляем уведомление, если статус изменился на APPROVED или REJECTED
        if (request.getReviewStatus() != null && !request.getReviewStatus().equals(oldStatus)) {
            User recipient = license.getUser();
            if (recipient != null) {
                if (request.getReviewStatus() == FileReviewStatus.APPROVED) {
                    notificationService.createLicenseReviewNotification(recipient, license.getName(), true, license.getId(), null);
                } else if (request.getReviewStatus() == FileReviewStatus.REJECTED) {
                    notificationService.createLicenseReviewNotification(recipient, license.getName(), false, license.getId(), request.getRejectionReason());
                }
            }
        }
        
        return mapToLicenseResponse(updatedLicense);
    }

    // Преобразует сущность Organisation в DTO OrganisationResponse.
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
                .yearsOfExperience(organisation.getYearsOfExperience())
                .status(organisation.getStatus());
        if (organisation.getSpecialization() != null) {
            builder.specialization(organisation.getSpecialization().stream()
                    .map(Enum::name)
                    .collect(Collectors.toList()));
        } else {
            builder.specialization(new ArrayList<>());
        }
        
        // Добавляем лицензии
        if (organisation.getLicenses() != null && !organisation.getLicenses().isEmpty()) {
            builder.licenses(organisation.getLicenses().stream()
                    .map(this::mapToLicenseResponse)
                    .collect(Collectors.toList()));
        }
        
        return builder.build();
    }

    // Преобразует сущность License в DTO LicenseResponse.
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
                .rejectionReason(license.getRejectionReason())
                .build();
    }
}