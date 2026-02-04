package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.auth.AuthResponse;
import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.dto.project.LicenseResponse;
import com.smartqurylys.backend.dto.user.organisation.LicenseUpdateRequest;
import com.smartqurylys.backend.dto.user.organisation.OrganisationCreateRequest;
import com.smartqurylys.backend.dto.user.organisation.OrganisationResponse;
import com.smartqurylys.backend.dto.user.organisation.OrganisationUpdateRequest;
import com.smartqurylys.backend.service.OrganisationService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

// Контроллер для управления организациями.
@RestController
@RequestMapping("/api/organisations")
@RequiredArgsConstructor
public class OrganisationController {

    private final OrganisationService organisationService;

    // Регистрация новой организации.
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerOrganisation(@Valid @RequestBody OrganisationCreateRequest request) {
        AuthResponse response = organisationService.createOrganisation(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Создание организации администратором.
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<OrganisationResponse> createOrganisation(@Valid @RequestBody OrganisationCreateRequest request) {
            OrganisationResponse response = organisationService.createOrganisationByAdmin(request);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Получение информации о своей организации.
    @GetMapping("/me")
    public ResponseEntity<OrganisationResponse> getMyOrganisationInfo() {
            OrganisationResponse response = organisationService.getOrganisationInfo();
            return ResponseEntity.ok(response);
    }

    // Получение информации об организации по ID (только для администраторов).
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<OrganisationResponse> getOrganisationById(@PathVariable Long id) {
        OrganisationResponse organisation = organisationService.getOrganisationById(id);
        return ResponseEntity.ok(organisation);
    }

    // Получение списка всех организаций.
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<List<OrganisationResponse>> getAllOrganisations() {
        List<OrganisationResponse> organisations = organisationService.getAllOrganisations();
        return ResponseEntity.ok(organisations);
    }

    // Обновление данных своей организации.
    @PutMapping("/me")
    public ResponseEntity<OrganisationResponse> updateOrganisation(@Valid @RequestBody OrganisationUpdateRequest request) {
        Long organisationId = organisationService.getOrganisationInfo().getId();
        OrganisationResponse updatedOrganisation = organisationService.updateOrganisation(organisationId, request);
        return ResponseEntity.ok(updatedOrganisation);
    }

    // Обновление данных организации по ID (только для администраторов).
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<OrganisationResponse> updateOrganisationByID(@PathVariable Long id, @Valid @RequestBody OrganisationUpdateRequest request) {
        OrganisationResponse updatedOrganisation = organisationService.updateOrganisation(id, request);
        return ResponseEntity.ok(updatedOrganisation);
    }

    // Удаление организации (только для администраторов).
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteOrganisation(@PathVariable Long id) {
        organisationService.deleteOrganisation(id);
        return ResponseEntity.noContent().build();
    }

    // Получение файлов своей организации.
    @GetMapping("/me/files")
    public ResponseEntity<List<FileResponse>> getOrganisationFiles() {
        Long organisationId = organisationService.getOrganisationInfo().getId();
        return ResponseEntity.ok(organisationService.getFilesByOrganisation(organisationId));
    }

    // Добавление лицензии для своей организации.
    @PostMapping("/me/licenses")
    public ResponseEntity<LicenseResponse> addLicenseToOrganisation(@RequestParam("file") MultipartFile file,
                                                                    @RequestParam(value = "licenseCategoryDisplay", required = false) String licenseCategoryDisplay) {
        try {
            Long organisationId = organisationService.getOrganisationInfo().getId();
            LicenseResponse response = organisationService.addLicenseToOrganisation(organisationId, file, licenseCategoryDisplay);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Получение лицензий своей организации.
    @GetMapping("me/licenses")
    public ResponseEntity<List<LicenseResponse>> getLicensesByOrganisation() {
        Long organisationId = organisationService.getOrganisationInfo().getId();
        List<LicenseResponse> licenses = organisationService.getLicensesByOrganisation(organisationId);
        return ResponseEntity.ok(licenses);
    }

    // Обновление своей лицензии.
    @PutMapping("me/licenses/{id}")
    public ResponseEntity<LicenseResponse> updateMyLicense(@PathVariable Long id,
                                                           @RequestParam(value = "file", required = false) MultipartFile file,
                                                           @RequestParam(value = "name", required = false) String name,
                                                           @RequestParam(value = "licenseCategoryDisplay", required = false) String licenseCategoryDisplay) throws IOException {
        Long organisationId = organisationService.getOrganisationInfo().getId();
        // Проверка прав доступа: лицензия должна принадлежать текущей организации
        List<LicenseResponse> myLicenses = organisationService.getLicensesByOrganisation(organisationId);
        boolean ownsLicense = myLicenses.stream().anyMatch(l -> l.getId().equals(id));
        
        if (!ownsLicense) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        LicenseResponse response = organisationService.updateLicenseForOrganisation(id, file, name, licenseCategoryDisplay);
        return ResponseEntity.ok(response);
    }

    // Загрузка файла для организации (только для администраторов).
    @PostMapping("/{id}/files")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> uploadOrganisationFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        organisationService.addFileToOrganisation(id, file);
        return ResponseEntity.ok().build();
    }

    // Получение файлов организации по ID (только для администраторов).
    @GetMapping("/{id}/files")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<FileResponse>> getOrganisationFiles(@PathVariable Long id) {
        return ResponseEntity.ok(organisationService.getFilesByOrganisation(id));
    }

    // Добавление лицензии для организации по ID (только для администраторов).
    @PostMapping("/{organisationId}/licenses")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<LicenseResponse> addLicenseToOrganisation(@PathVariable Long organisationId,
                                                                    @RequestParam("file") MultipartFile file,
                                                                    @RequestParam(value = "licenseCategoryDisplay", required = false) String licenseCategoryDisplay) {
        try {
            LicenseResponse response = organisationService.addLicenseToOrganisation(organisationId, file, licenseCategoryDisplay);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Получение лицензий организации по ID (только для администраторов).
    @GetMapping("/{organisationId}/licenses")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<LicenseResponse>> getLicensesByOrganisation(@PathVariable Long organisationId) {

            List<LicenseResponse> licenses = organisationService.getLicensesByOrganisation(organisationId);
            return ResponseEntity.ok(licenses);
    }

    // Обновление лицензии (только для администраторов).
    @PutMapping("licenses/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<LicenseResponse> updateLicense(@PathVariable Long id, @Valid @RequestBody LicenseUpdateRequest request) {
            LicenseResponse response = organisationService.updateLicense(id, request);
            return ResponseEntity.ok(response);
    }

    // Публичный эндпоинт для получения лицензий организации.
    @GetMapping("/public/licenses/{organisationId}")
    public ResponseEntity<List<LicenseResponse>> getPublicLicensesByOrganisation(@PathVariable Long organisationId) {
        List<LicenseResponse> licenses = organisationService.getLicensesByOrganisation(organisationId);
        return ResponseEntity.ok(licenses);
    }

}