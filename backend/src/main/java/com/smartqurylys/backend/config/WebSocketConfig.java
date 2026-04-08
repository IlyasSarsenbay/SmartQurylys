package com.smartqurylys.backend.config;

import com.smartqurylys.backend.security.WebSocketAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// WebSocket configuration for real-time messaging in the application.
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Включить простой брокер в памяти только для адресов /topic.
        config.enableSimpleBroker("/topic");
        // Все сообщения, отправляемые с клиента на сервер, должны использовать префикс /app.
        // Это направляет их через ChatController,
        // где они проверяются, сохраняются в базе данных, а затем перенаправляются на /topic.
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Зарегистрировать конечную точку /ws для первоначального рукопожатия WebSocket.
        // Клиенты подключаются к этому URL для установления постоянного соединения WebSocket.
        registry.addEndpoint("/ws")
                .setAllowedOrigins("*")
                .withSockJS(); // Для браузеров, не поддерживающих WebSocket, используется резервный вариант с SockJS.
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Регистрируем перехватчик канала для проверки токенов JWT при каждой команде CONNECT.
        // Это гарантирует, что только аутентифицированные пользователи смогут открыть сессию WebSocket.
        registration.interceptors(webSocketAuthChannelInterceptor);
    }
}
