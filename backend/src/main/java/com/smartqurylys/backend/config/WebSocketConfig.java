package com.smartqurylys.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// Конфигурация WebSocket для обмена сообщениями в реальном времени.
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Включаем простой брокер сообщений для направлений /topic и /queue.
        config.enableSimpleBroker("/topic", "/queue");
        // Устанавливаем префикс для сообщений от клиента к серверу.
        config.setApplicationDestinationPrefixes("/app");
        // Префикс для сообщений конкретному пользователю.
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Регистрируем эндпоинт /ws для подключения клиентов.
        registry.addEndpoint("/ws")
                .setAllowedOrigins("*")
                .withSockJS(); // Используем SockJS для поддержки в старых браузерах.
    }
}