package com.smartqurylys.backend.dto.project;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

// Объект передачи данных для ответа с информацией о файле.
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FileResponse {
    private Long id; // Идентификатор файла.
    private String name; // Имя файла.
    private String filepath; // Путь к файлу на сервере.
    private Long size; // Размер файла в байтах.
    private LocalDateTime createdAt; // Дата и время создания файла.
    private String creatorIinBin; // ИИН/БИН пользователя, загрузившего файл.
}