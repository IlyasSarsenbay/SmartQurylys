package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.License;
import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LicenseRepository extends JpaRepository<License, Long> {
    @Query(value = "SELECT l.*, f.* FROM licenses l JOIN files f ON l.id = f.id WHERE l.organisation_id = :organisationId", nativeQuery = true)
    List<License> findByOrganisationId(Long organisationId);

    List<License> findByReviewStatus(FileReviewStatus reviewStatus);
}
