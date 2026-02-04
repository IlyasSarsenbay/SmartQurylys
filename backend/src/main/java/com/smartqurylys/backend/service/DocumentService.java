package com.smartqurylys.backend.service;

import com.smartqurylys.backend.entity.Document;
import com.smartqurylys.backend.repository.DocumentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

// Сервис для управления операциями с документами (CRUD).
@Service
public class DocumentService {

    private final DocumentRepository repo;

    public DocumentService(DocumentRepository repo) {
        this.repo = repo;
    }

    // Возвращает список всех документов.
    public List<Document> getAll() {
        return repo.findAll();
    }

    // Возвращает документ по его идентификатору.
    public Optional<Document> getById(int id) {
        return repo.findById(id);
    }

    // Создает новый документ.
    public Document create(Document doc) {
        doc.setUploadDate(new java.util.Date());
        return repo.save(doc);
    }

    // Обновляет существующий документ.
    public Document update(int id, Document doc) {
        return repo.findById(id).map(existing -> {
            existing.setName(doc.getName());
            existing.setFilePath(doc.getFilePath());
            existing.setStatus(doc.getStatus());
            return repo.save(existing);
        }).orElseThrow(() -> new RuntimeException("Not found"));
    }

    // Удаляет документ по его идентификатору.
    public void delete(int id) {
        repo.deleteById(id);
    }
}
