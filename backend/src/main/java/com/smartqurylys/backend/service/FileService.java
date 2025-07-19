package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.entity.File;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.FileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;

    private final Path rootLocation = Paths.get("uploads");

    public File prepareFile(MultipartFile file, User currentUser) throws IOException {
        if (!Files.exists(rootLocation)) {
            Files.createDirectories(rootLocation);
        }

        String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path destination = rootLocation.resolve(filename);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        File savedFile = File.builder()
                .name(file.getOriginalFilename())
                .filepath(destination.toString())
                .size(file.getSize())
                .user(currentUser)
                .createdAt(LocalDateTime.now())
                .build();

        return fileRepository.save(savedFile);
    }


    public Resource loadAsResource(Long id) throws MalformedURLException {
        File file = fileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Файл не найден"));

        Path path = Paths.get(file.getFilepath());
        Resource resource = new UrlResource(path.toUri());

        if (resource.exists() || resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("Не удалось прочитать файл");
        }
    }

    public FileResponse getFileInfo(Long id) {
        File file = fileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Файл не найден"));
        return mapToFileResponse(file);
    }

    public void deleteFile(Long id) throws IOException {
        File file = fileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Файл не найден"));

        Files.deleteIfExists(Paths.get(file.getFilepath()));
        fileRepository.delete(file);
    }

    public FileResponse mapToFileResponse(File file) {
        return FileResponse.builder()
                .id(file.getId())
                .name(file.getName())
                .filepath(file.getFilepath())
                .size(file.getSize())
                .createdAt(file.getCreatedAt())
                .creatorIinBin(file.getUser() != null ? file.getUser().getIinBin() : null)
                .build();
    }
}
