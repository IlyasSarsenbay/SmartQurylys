package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.License;
import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

// Репозиторий для работы с сущностями License.
@Repository
public interface LicenseRepository extends JpaRepository<License, Long> {
    // Находит все лицензии для заданной организации по ее ID.
    @Query(value = "SELECT l.*, f.* FROM licenses l JOIN files f ON l.id = f.id WHERE l.organisation_id = :organisationId", nativeQuery = true)
    List<License> findByOrganisationId(Long organisationId);

    // Находит все лицензии с определенным статусом проверки.
    List<License> findByReviewStatus(FileReviewStatus reviewStatus);
}
