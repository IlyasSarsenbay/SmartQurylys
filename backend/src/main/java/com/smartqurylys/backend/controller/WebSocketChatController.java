package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.chat.ChatMessageRequest;
import com.smartqurylys.backend.dto.chat.ChatMessageResponse;
import com.smartqurylys.backend.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.io.IOException;

// Контроллер для обработки сообщений WebSocket чата.
@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    // Отправка сообщения в чат.
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageRequest chatMessageRequest) throws IOException {
        // Сохраняем сообщение и отправляем его всем подписчикам топика беседы.
        ChatMessageResponse savedMessage = chatMessageService.sendMessage(chatMessageRequest, null);
        messagingTemplate.convertAndSend("/topic/conversations/" + savedMessage.getConversationId() + "/messages", savedMessage);
    }

    // Обработка добавления пользователя в чат.
    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessageRequest chatMessageRequest) {
        // Отправляем уведомление о присоединении пользователя.
        messagingTemplate.convertAndSend("/topic/conversations/" + chatMessageRequest.getConversationId() + "/messages", "Пользователь присоединился");
    }
}