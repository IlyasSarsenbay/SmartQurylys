package com.smartqurylys.backend.shared.enums;

// Перечисление для различных статусов документа.
public enum DocumentStatus {
    WAITING, // Ожидает начала работы.
    CREATION, // На стадии создания.
    APPROVAL, // На стадии утверждения.
    SIGNATURE, // На стадии подписания.
    REGISTRATION, // На стадии регистрации.
    IN_PROGRESS, // В процессе работы.
    COMPLETED // Завершен.
}