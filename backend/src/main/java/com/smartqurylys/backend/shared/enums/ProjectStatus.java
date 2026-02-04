package com.smartqurylys.backend.shared.enums;

// Перечисление, определяющее различные статусы проекта.
public enum ProjectStatus {
    DRAFT, // Черновик.
    WAITING, // Ожидает старта.
    ACTIVE, // Активный.
    ON_PAUSE, // Приостановлен.
    COMPLETED, // Завершен.
    CANCELLED // Отменен.
}