package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.dto.chat.ChatMessageRequest;
import com.smartqurylys.backend.dto.chat.ChatMessageResponse;
import com.smartqurylys.backend.service.ChatMessageService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

// Контроллер для управления сообщениями в чате.
@RestController
@RequestMapping("/api/chat-messages")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    // Получение истории сообщений для указанной беседы.
    @GetMapping("/conversation/{conversationId}/history")
    public ResponseEntity<List<ChatMessageResponse>> getChatHistory(@PathVariable Long conversationId) {
        try {
            List<ChatMessageResponse> messages = chatMessageService.getMessageHistory(conversationId);
            return ResponseEntity.ok(messages);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    // Отправка нового сообщения, возможно с прикрепленным файлом.
    @PostMapping
    public ResponseEntity<ChatMessageResponse> sendMessage(
            // @RequestPart используется для обработки multipart/form-data запросов,
            // которые содержат и JSON, и файлы.
            @RequestPart("messageData") @Valid ChatMessageRequest request, // JSON часть
            @RequestPart(value = "attachedFile", required = false) MultipartFile attachedFile // Файл часть
    ) {
        try {
            ChatMessageResponse response = chatMessageService.sendMessage(request, attachedFile);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
