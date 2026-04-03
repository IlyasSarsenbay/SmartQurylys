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
        // Enable a simple in-memory broker for /topic destinations only.
        config.enableSimpleBroker("/topic");
        // All messages sent from the client to the server must use the /app prefix.
        // This routes them through the application controller layer (e.g., ChatController)
        // where they are validated, persisted to the database, and then forwarded to /topic.
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the /ws endpoint for the initial WebSocket handshake.
        // Clients connect to this URL to establish a persistent WebSocket connection.
        registry.addEndpoint("/ws")
                .setAllowedOrigins("*")
                .withSockJS(); // Fallback to SockJS for browsers that do not support native WebSocket.
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Register the Channel Interceptor to validate JWT tokens on every CONNECT command.
        // This ensures only authenticated users can open a WebSocket session.
        registration.interceptors(webSocketAuthChannelInterceptor);
    }
}
