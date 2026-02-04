package com.smartqurylys.backend.shared.enums;

// Перечисление, определяющее тип сообщения в чате.
public enum MessageType {
    TEXT, // Обычное текстовое сообщение.
    ATTACHMENT, // Сообщение, содержащее только файл.
    MENTION, // Сообщение, являющееся упоминанием пользователя.
    COORDINATION_REQUEST, // Запрос на согласование чего-либо.
    ACKNOWLEDGEMENT_REQUEST, // Запрос на ознакомление с чем-либо.
    COORDINATION_RESPONSE, // Ответ на запрос согласования (согласовано/отклонено).
    ACKNOWLEDGEMENT_RESPONSE, // Ответ на запрос ознакомления (ознакомлен).
    SYSTEM_ACTION // Сообщение о системном действии (например, "пользователь присоединился к чату").
}