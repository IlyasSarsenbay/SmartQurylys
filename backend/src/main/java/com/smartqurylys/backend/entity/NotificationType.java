package com.smartqurylys.backend.entity;

// Перечисление типов уведомлений в системе.
public enum NotificationType {
    INVITATION,            // Приглашение в проект.
    PROJECT_UPDATE,        // Обновление проекта.
    FILE_UPLOAD,           // Загрузка файла.
    TASK_ASSIGNMENT,       // Назначение задачи.
    MENTION,               // Упоминание в чате.
    STAGE_REACTIVATION,    // Возврат этапа в активное состояние.
    LICENSE_APPROVED,      // Лицензия одобрена.
    LICENSE_REJECTED,      // Лицензия отклонена.
    TASK_ACCEPTED,         // Задача принята.
    TASK_DECLINED,         // Задача отклонена.
    TASK_RETURNED          // Задача возвращена в работу.
}
