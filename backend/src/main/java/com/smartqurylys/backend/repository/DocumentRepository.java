package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Document;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

// Репозиторий для работы с сущностями Document.
public interface DocumentRepository extends JpaRepository<Document, Integer> {

    List<Document> findByProjectId(Integer projectId);
    
}
