package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.document.DocumentDetailsResponse;
import com.smartqurylys.backend.dto.project.document.DocumentRequest;
import com.smartqurylys.backend.dto.project.document.DocumentShortResponse;
import com.smartqurylys.backend.entity.Comment;
import com.smartqurylys.backend.entity.Document;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.DocumentRepository;
import com.smartqurylys.backend.repository.UserRepository;
import com.smartqurylys.backend.service.DocumentService;

import lombok.AllArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

// Контроллер для управления документами.

@RestController
@RequestMapping("/api/documents")
@AllArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    // Get short info of all docs of the project
    @GetMapping("/project/{projectId}")
    public List<DocumentShortResponse> getByProject(@PathVariable Integer projectId) {
        return documentService.getDocumentsByProject(projectId);
    }

    // Get full doc info
    @GetMapping("/{id}")
    public DocumentDetailsResponse getById(@PathVariable Integer id) {
        return documentService.getById(id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentDetailsResponse> create(
            @RequestPart("request") DocumentRequest request,
            @RequestPart("file") MultipartFile file) throws IOException {

        return ResponseEntity.ok(documentService.addDocument(request, file));
    }

    // Delete
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        documentService.delete(id);
    }

    // get short info about project's documents
    @GetMapping("{id}/documents")
    public ResponseEntity<List<DocumentShortResponse>> getProjectDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocumentsByProject(id.intValue()));
    }

    // @PostMapping("/{id}/comment")
    // public ResponseEntity<?> addComment(@PathVariable int id, @RequestBody
    // Comment comment) {
    // boolean success = service.addCommentToDocument(id, comment);
    // if (success) {
    // return ResponseEntity.ok("Comment added");
    // } else {
    // return ResponseEntity.notFound().build();
    // }
    // }
    //
    //
    // @PostMapping("/{id}/sign")
    // public ResponseEntity<?> signDocument(@PathVariable int id, @RequestParam int
    // participantId) {
    // String result = service.signDocument(id, participantId);
    // if (result.equals("OK")) {
    // return ResponseEntity.ok("Document signed");
    // } else {
    // return ResponseEntity.badRequest().body(result);
    // }
    // }
}
