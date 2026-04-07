package com.smartqurylys.backend.security;

import com.smartqurylys.backend.shared.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

// Перехватчик для соединений WebSocket: проверяет токен JWT во время установления соединения CONNECT.
// Это гарантирует, что установить сессию WebSocket могут только аутентифицированные пользователи.
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Проверка токена необходима только при выполнении первоначальной команды CONNECT.
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            // Если отсутствует действительный заголовок Authorization, соединение отклоняется.
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing or invalid Authorization header in WebSocket CONNECT.");
            }

            String token = authHeader.substring(7);

            try {
                // Извлекаем имя пользователя (адрес электронной почты) из токена и загружаем пользователя.
                String email = jwtUtils.extractUsername(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // Проверяем токен на соответствие загруженным данным пользователя.
                if (!jwtUtils.isTokenValid(token, userDetails)) {
                    throw new IllegalArgumentException("Invalid or expired JWT token in WebSocket CONNECT.");
                }

                // Устанавливаем аутентифицированного пользователя в контекст сессии WebSocket.
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                accessor.setUser(authToken);

            } catch (Exception e) {
                throw new IllegalArgumentException("JWT validation failed during WebSocket handshake: " + e.getMessage());
            }
        }

        return message;
    }
}
