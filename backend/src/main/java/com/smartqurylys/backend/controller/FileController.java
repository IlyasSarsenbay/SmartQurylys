package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.entity.File;
import com.smartqurylys.backend.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

// Контроллер для работы с файлами.
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    // Получение информации о файле по ID.
    @GetMapping("/{id}")
    public ResponseEntity<FileResponse> getFileInfo(@PathVariable Long id) {
        return ResponseEntity.ok(fileService.getFileInfo(id));
    }

    // Скачивание файла по ID.
    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) throws IOException {
        // Получаем информацию о файле из базы.
        File fileEntity = fileService.getFileEntity(id);

        // Читаем файл в виде массива байт.
        byte[] fileBytes = fileService.loadFileAsByteArray(fileEntity);

        // Определяем тип контента для корректной отдачи файла браузеру.
        String contentType = fileService.getContentTypeByFilename(fileEntity.getFilepath());
        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        // Возвращаем файл.
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileEntity.getName() + "\"")
                .contentLength(fileBytes.length)
                .body(fileBytes);
    }

    // Удаление файла по ID.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) throws IOException {
        fileService.deleteFile(id);
        return ResponseEntity.noContent().build();
    }
}