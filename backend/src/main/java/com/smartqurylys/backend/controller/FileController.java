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

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @GetMapping("/{id}")
    public ResponseEntity<FileResponse> getFileInfo(@PathVariable Long id) {
        return ResponseEntity.ok(fileService.getFileInfo(id));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) throws IOException {
        // Получаем объект File из базы данных, чтобы иметь доступ к полному пути
        File fileEntity = fileService.getFileEntity(id);

        // Читаем весь файл в массив байтов
        byte[] fileBytes = fileService.loadFileAsByteArray(fileEntity);

        // Определяем MIME-тип
        String contentType = fileService.getContentTypeByFilename(fileEntity.getFilepath());
        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        // Возвращаем файл в виде массива байтов
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileEntity.getName() + "\"")
                .contentLength(fileBytes.length) // Устанавливаем размер файла
                .body(fileBytes);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) throws IOException {
        fileService.deleteFile(id);
        return ResponseEntity.noContent().build();
    }
}