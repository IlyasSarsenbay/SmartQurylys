package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.RepresentativeDocument;
import com.smartqurylys.backend.shared.enums.FileReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

// Репозиторий для работы с сущностями RepresentativeDocument.
@Repository
public interface RepresentativeDocumentRepository extends JpaRepository<RepresentativeDocument, Long> {
    
    // Находит все документы представителя для заданной организации по ее ID.
    @Query(value = "SELECT rd.*, f.* FROM representative_documents rd JOIN files f ON rd.id = f.id WHERE rd.organisation_id = :organisationId", nativeQuery = true)
    List<RepresentativeDocument> findByOrganisationId(Long organisationId);

    // Находит все документы представителя с определенным статусом проверки.
    List<RepresentativeDocument> findByReviewStatus(FileReviewStatus reviewStatus);
}
