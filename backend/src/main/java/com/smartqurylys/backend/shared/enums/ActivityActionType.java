package com.smartqurylys.backend.shared.enums;

public enum ActivityActionType {
    REQUEST_ACCEPTANCE, // Просит принять исполнение
    ACCEPTED_ACCEPTANCE, // Принято исполнение
    REJECTED_ACCEPTANCE, // Отклонено исполнение
    PROJECT_UPDATED, // Проект обновлен
    STAGE_UPDATED, // Этап обновлен
    STAGE_DELETED, // Этап удален
    FILE_ADDED, // Добавил файл
    FILE_DELETED, // Удалил файл
}