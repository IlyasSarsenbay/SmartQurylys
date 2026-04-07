package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.document.DocumentDetailsResponse;
import com.smartqurylys.backend.dto.project.document.DocumentRequest;
import com.smartqurylys.backend.dto.project.document.DocumentShortResponse;
import com.smartqurylys.backend.entity.Document;
import com.smartqurylys.backend.entity.File;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.DocumentRepository;
import com.smartqurylys.backend.repository.FileRepository;
import com.smartqurylys.backend.repository.ParticipantRepository;
import com.smartqurylys.backend.repository.ProjectRepository;
import com.smartqurylys.backend.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final FileRepository fileRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;

    private final FileService fileService;

    public List<DocumentShortResponse> getDocumentsByProject(Integer projectId) {
        List<Document> docs = documentRepository.findByProjectId(projectId);
        return docs.stream()
                .map(DocumentService::mapToDocumentShortResponse)
                .toList();
    }

    public DocumentDetailsResponse getById(Integer id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        return mapToDetailsResponse(document);
    }

    @Transactional
    public DocumentDetailsResponse addDocument(DocumentRequest request, MultipartFile file) throws IOException {
        Document document = new Document();

        applyRequestToDocument(document, request);

        User currentUser = getAuthenticatedUser();

        File savedFile = fileService.prepareFile(file, currentUser);
        document.setFilePath(savedFile.getFilepath());
        document.setFiles(List.of(savedFile));
        document.setUploadedBy(currentUser);

        return mapToDetailsResponse(documentRepository.save(document));
    }

    public void delete(Long id) {
        documentRepository.deleteById(id.intValue());
    }

    private void applyRequestToDocument(Document document, DocumentRequest request) {
        document.setName(request.getName());
        document.setStatus(request.getStatus());
        document.setUploadDate(
                request.getUploadDate() != null ? request.getUploadDate() : new Date());

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
        document.setProject(project);

        if (request.getFileIds() != null) {
            document.setFiles(fileRepository.findAllById(request.getFileIds()));
        }

        if (request.getHaveToSignParticipantIds() != null) {
            document.setHaveToSign(
                    participantRepository.findAllById(request.getHaveToSignParticipantIds()));
        }

        if (request.getSignedParticipantIds() != null) {
            document.setSigned(
                    participantRepository.findAllById(request.getSignedParticipantIds()));
        }
    }

    public static DocumentShortResponse mapToDocumentShortResponse(Document document) {
        if (document == null) {
            return null;
        }

        return DocumentShortResponse.builder()
                .id(document.getId())
                .name(document.getName())
                .status(document.getStatus())
                .uploadDate(document.getUploadDate())
                .uploaderEmail(document.getUploadedBy().getEmail())
                .uploaderName(document.getUploadedBy().getFullName())
                .build();
    }

    public static DocumentDetailsResponse mapToDetailsResponse(Document document) {
        if (document == null) {
            return null;
        }

        return DocumentDetailsResponse.builder()
                .id(document.getId().longValue())
                .projectId(document.getProject() != null ? document.getProject().getId() : null)
                .name(document.getName())
                .filePath(document.getFilePath())
                .uploadDate(document.getUploadDate())
                .status(document.getStatus())
                .files(FileService.mapToFileResponseList(document.getFiles()))
                .haveToSign(ParticipantService.mapToParticipantResponseList(document.getHaveToSign()))
                .signed(ParticipantService.mapToParticipantResponseList(document.getSigned()))
                .uploaderEmail(document.getUploadedBy().getEmail())
                .uploaderName(document.getUploadedBy().getFullName())
                .build();
    }

    // Вспомогательный метод для получения аутентифицированного пользователя.
    private User getAuthenticatedUser() {
        String email = getAuthenticatedEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    // Вспомогательный метод для получения email аутентифицированного пользователя.
    private String getAuthenticatedEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        } else {
            return principal.toString();
        }
    }

}
