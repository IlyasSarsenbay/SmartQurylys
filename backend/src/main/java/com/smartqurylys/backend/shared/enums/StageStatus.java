package com.smartqurylys.backend.shared.enums;

// Перечисление, определяющее различные статусы этапа работ.
public enum StageStatus {
    WAITING, // Ожидает начала.
    ACTIVE, // Активен, в работе.
    ON_PAUSE, // Приостановлен.
    COMPLETED, // Завершен.
}