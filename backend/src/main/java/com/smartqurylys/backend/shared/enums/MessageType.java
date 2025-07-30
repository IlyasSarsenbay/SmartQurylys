package com.smartqurylys.backend.shared.enums;

public enum MessageType {
    TEXT,
    ATTACHMENT, // Сообщение, содержащее только файл
    MENTION, // Сообщение, которое является упоминанием
    COORDINATION_REQUEST, // Запрос на согласование
    ACKNOWLEDGEMENT_REQUEST, // Запрос на ознакомление
    COORDINATION_RESPONSE, // Ответ на запрос согласования (согласовано/отклонено)
    ACKNOWLEDGEMENT_RESPONSE, // Ответ на запрос ознакомления (ознакомлен)
    SYSTEM_ACTION // Действие системы (например, "пользователь присоединился к чату")
}