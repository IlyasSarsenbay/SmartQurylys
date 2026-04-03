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

// Interceptor for WebSocket connections: validates the JWT token during the CONNECT handshake.
// This ensures that only authenticated users can establish a WebSocket session.
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // We only need to validate the token during the initial CONNECT command.
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            // If no valid Authorization header is present, reject the connection.
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing or invalid Authorization header in WebSocket CONNECT.");
            }

            String token = authHeader.substring(7);

            try {
                // Extract the username (email) from the token and load the user.
                String email = jwtUtils.extractUsername(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // Validate the token against the loaded user details.
                if (!jwtUtils.isTokenValid(token, userDetails)) {
                    throw new IllegalArgumentException("Invalid or expired JWT token in WebSocket CONNECT.");
                }

                // Set the authenticated user into the WebSocket session context.
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
