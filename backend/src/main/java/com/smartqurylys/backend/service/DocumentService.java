package com.smartqurylys.service;

import com.smartqurylys.entity.Document;
import com.smartqurylys.repository.DocumentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DocumentService {

    private final DocumentRepository repo;

    public DocumentService(DocumentRepository repo) {
        this.repo = repo;
    }

    public List<Document> getAll() {
        return repo.findAll();
    }

    public Optional<Document> getById(int id) {
        return repo.findById(id);
    }

    public Document create(Document doc) {
        doc.setUploadDate(new java.util.Date());
        return repo.save(doc);
    }

    public Document update(int id, Document doc) {
        return repo.findById(id).map(existing -> {
            existing.setName(doc.getName());
            existing.setFilePath(doc.getFilePath());
            existing.setStatus(doc.getStatus());
            return repo.save(existing);
        }).orElseThrow(() -> new RuntimeException("Not found"));
    }

    public void delete(int id) {
        repo.deleteById(id);
    }
}
