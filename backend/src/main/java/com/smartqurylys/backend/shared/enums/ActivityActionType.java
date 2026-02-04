package com.smartqurylys.backend.shared.enums;

// Перечисление, определяющее типы действий в журнале активности.
public enum ActivityActionType {
    REQUEST_ACCEPTANCE, // Запрос на приемку выполнения.
    ACCEPTED_ACCEPTANCE, // Приемка выполнения подтверждена.
    REJECTED_ACCEPTANCE, // Приемка выполнения отклонена.
    PROJECT_UPDATED, // Проект обновлен.
    STAGE_UPDATED, // Этап обновлен.
    STAGE_DELETED, // Этап удален.
    FILE_ADDED, // Файл добавлен.
    FILE_DELETED, // Файл удален.
}