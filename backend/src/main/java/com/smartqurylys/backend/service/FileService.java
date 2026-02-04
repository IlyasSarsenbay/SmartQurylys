package com.smartqurylys.backend.service;

import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.entity.File;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.repository.FileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLConnection;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

// Сервис для управления файлами: загрузка, получение, удаление и определение MIME-типов.
@Service
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;

    // Корневая директория для хранения загруженных файлов.
    private final Path rootLocation = Paths.get("uploads");

    // Статическая карта для определения MIME-типов по расширениям файлов.
    private static final Map<String, String> MIME_TYPE_MAP;
    static {
        Map<String, String> map = new HashMap<>();
        map.put("pdf", "application/pdf");
        map.put("txt", "text/plain");
        map.put("png", "image/png");
        map.put("jpg", "image/jpeg");
        map.put("jpeg", "image/jpeg");
        map.put("gif", "image/gif");
        map.put("bmp", "image/bmp");
        map.put("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        map.put("doc", "application/msword");
        map.put("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        map.put("xls", "application/vnd.ms-excel");
        map.put("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
        map.put("ppt", "application/vnd.ms-powerpoint");
        map.put("zip", "application/zip");
        map.put("rar", "application/x-rar-compressed");
        map.put("mp3", "audio/mpeg");
        map.put("mp4", "video/mp4");
        MIME_TYPE_MAP = Collections.unmodifiableMap(map);
    }

    // Подготавливает и сохраняет загруженный файл, создавая запись в базе данных.
    public File prepareFile(MultipartFile file, User currentUser) throws IOException {
        if (!Files.exists(rootLocation)) {
            Files.createDirectories(rootLocation);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(file);
        // Если расширение не определено, пытаемся угадать его по MIME-типу.
        if (extension == null || extension.isEmpty()) {
            extension = guessExtensionFromContentType(file.getContentType());
        }

        String safeExtension = (extension != null && !extension.startsWith(".")) ? "." + extension : extension;
        String filename = "temp_" + System.currentTimeMillis() + "_" + UUID.randomUUID() + (safeExtension != null ? safeExtension : "");

        Path destination = rootLocation.resolve(filename);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        File savedFile = File.builder()
                .name(originalFilename != null ? originalFilename : filename)
                .filepath(destination.toString())
                .size(file.getSize())
                .user(currentUser)
                .createdAt(LocalDateTime.now())
                .build();

        return fileRepository.save(savedFile);
    }

    // Получает сущность файла по его ID.
    public File getFileEntity(Long id) {
        return fileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Файл не найден"));
    }

    // Загружает содержимое файла в виде массива байтов.
    public byte[] loadFileAsByteArray(File file) throws IOException {
        Path path = Paths.get(file.getFilepath());
        return Files.readAllBytes(path);
    }

    // Определяет MIME-тип файла по его имени.
    public String getContentTypeByFilename(String filename) {
        String fileExtension = Optional.ofNullable(filename)
                .filter(f -> f.contains("."))
                .map(f -> f.substring(filename.lastIndexOf(".") + 1))
                .orElse("");

        String mimeType = MIME_TYPE_MAP.get(fileExtension.toLowerCase());
        System.out.println("Имя файла: " + filename);
        System.out.println("Расширение: " + fileExtension);
        System.out.println("MIME type: " + mimeType);
        if (mimeType != null) {
            return mimeType;
        }

        return URLConnection.guessContentTypeFromName(filename);
    }

    // Получает информацию о файле по его ID в формате DTO.
    public FileResponse getFileInfo(Long id) {
        File file = getFileEntity(id);
        return mapToFileResponse(file);
    }

    // Удаляет файл из файловой системы и его запись из базы данных.
    public void deleteFile(Long id) throws IOException {
        File file = getFileEntity(id);
        Files.deleteIfExists(Paths.get(file.getFilepath()));
        fileRepository.delete(file);
    }

    // Преобразует сущность File в DTO FileResponse.
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

    // Вспомогательный метод для получения расширения файла из его имени.
    private String getFileExtension(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            return originalName.substring(originalName.lastIndexOf(".") + 1);
        }
        return "";
    }

    // Вспомогательный метод для угадывания расширения файла по его MIME-типу.
    private String guessExtensionFromContentType(String contentType) {
        if (contentType == null) return "";
        for (Map.Entry<String, String> entry : MIME_TYPE_MAP.entrySet()) {
            if (entry.getValue().equalsIgnoreCase(contentType)) {
                return entry.getKey();
            }
        }
        return "";
    }
}


