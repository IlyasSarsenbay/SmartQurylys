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

@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageRequest chatMessageRequest) throws IOException {

        ChatMessageResponse savedMessage = chatMessageService.sendMessage(chatMessageRequest, null); // Файл пока null

        messagingTemplate.convertAndSend("/topic/conversations/" + savedMessage.getConversationId() + "/messages", savedMessage);
    }


    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessageRequest chatMessageRequest) {

        messagingTemplate.convertAndSend("/topic/conversations/" + chatMessageRequest.getConversationId() + "/messages", "Пользователь присоединился");
    }

}