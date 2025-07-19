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

@RestController
@RequestMapping("/api/organisations")
@RequiredArgsConstructor
public class OrganisationController {

    private final OrganisationService organisationService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerOrganisation(@Valid @RequestBody OrganisationCreateRequest request) {
        AuthResponse response = organisationService.createOrganisation(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<OrganisationResponse> createOrganisation(@Valid @RequestBody OrganisationCreateRequest request) {
        try {
            OrganisationResponse response = organisationService.createOrganisationByAdmin(request); // <-- ИСПОЛЬЗУЕМ НОВЫЙ МЕТОД
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<OrganisationResponse> getMyOrganisationInfo() {
            OrganisationResponse response = organisationService.getOrganisationInfo();
            return ResponseEntity.ok(response);
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<OrganisationResponse> getOrganisationById(@PathVariable Long id) {
        OrganisationResponse organisation = organisationService.getOrganisationById(id);
        return ResponseEntity.ok(organisation);
    }


    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<OrganisationResponse>> getAllOrganisations() {
        List<OrganisationResponse> organisations = organisationService.getAllOrganisations();
        return ResponseEntity.ok(organisations);
    }

    @PutMapping("/me")
    public ResponseEntity<OrganisationResponse> updateOrganisation(@Valid @RequestBody OrganisationUpdateRequest request) {
        Long organisationId = organisationService.getOrganisationInfo().getId();
        OrganisationResponse updatedOrganisation = organisationService.updateOrganisation(organisationId, request);
        return ResponseEntity.ok(updatedOrganisation);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<OrganisationResponse> updateOrganisationByID(@PathVariable Long id, @Valid @RequestBody OrganisationUpdateRequest request) {
        OrganisationResponse updatedOrganisation = organisationService.updateOrganisation(id, request);
        return ResponseEntity.ok(updatedOrganisation);
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteOrganisation(@PathVariable Long id) {
        organisationService.deleteOrganisation(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/me/files")
    public ResponseEntity<List<FileResponse>> getOrganisationFiles() {
        Long organisationId = organisationService.getOrganisationInfo().getId();
        return ResponseEntity.ok(organisationService.getFilesByOrganisation(organisationId));
    }

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

    @GetMapping("me/licenses")
    public ResponseEntity<List<LicenseResponse>> getLicensesByOrganisation() {
        Long organisationId = organisationService.getOrganisationInfo().getId();
        List<LicenseResponse> licenses = organisationService.getLicensesByOrganisation(organisationId);
        return ResponseEntity.ok(licenses);
    }

    @PostMapping("/{id}/files")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> uploadOrganisationFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        organisationService.addFileToOrganisation(id, file);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/files")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<FileResponse>> getOrganisationFiles(@PathVariable Long id) {
        return ResponseEntity.ok(organisationService.getFilesByOrganisation(id));
    }

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

    @GetMapping("/{organisationId}/licenses")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<LicenseResponse>> getLicensesByOrganisation(@PathVariable Long organisationId) {

            List<LicenseResponse> licenses = organisationService.getLicensesByOrganisation(organisationId);
            return ResponseEntity.ok(licenses);
    }

    @PutMapping("licenses/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<LicenseResponse> updateLicense(@PathVariable Long id, @Valid @RequestBody LicenseUpdateRequest request) {
            LicenseResponse response = organisationService.updateLicense(id, request);
            return ResponseEntity.ok(response);
    }

}