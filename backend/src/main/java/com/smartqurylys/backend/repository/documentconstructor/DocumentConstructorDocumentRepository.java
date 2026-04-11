package com.smartqurylys.backend.repository.documentconstructor;

import com.smartqurylys.backend.entity.DocumentConstructorDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentConstructorDocumentRepository extends JpaRepository<DocumentConstructorDocument, Long> {
    List<DocumentConstructorDocument> findByOwnerUserIdOrderByUpdatedAtDesc(Long ownerUserId);
}
