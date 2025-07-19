package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.entity.Comment;
import com.smartqurylys.backend.entity.Document;
import com.smartqurylys.backend.service.DocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Document> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getById(@PathVariable int id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Document create(@RequestBody Document doc) {
        return service.create(doc);
    }

    @PutMapping("/{id}")
    public Document update(@PathVariable int id, @RequestBody Document doc) {
        return service.update(id, doc);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    
//    @PostMapping("/{id}/comment")
//    public ResponseEntity<?> addComment(@PathVariable int id, @RequestBody Comment comment) {
//        boolean success = service.addCommentToDocument(id, comment);
//        if (success) {
//            return ResponseEntity.ok("Comment added");
//        } else {
//            return ResponseEntity.notFound().build();
//        }
//    }
//
//
//    @PostMapping("/{id}/sign")
//    public ResponseEntity<?> signDocument(@PathVariable int id, @RequestParam int participantId) {
//        String result = service.signDocument(id, participantId);
//        if (result.equals("OK")) {
//            return ResponseEntity.ok("Document signed");
//        } else {
//            return ResponseEntity.badRequest().body(result);
//        }
//    }
}
