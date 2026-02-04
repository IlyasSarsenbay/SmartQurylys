package com.smartqurylys.backend.shared.utils;

import com.smartqurylys.backend.security.JwtProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Collection; // Added import for Collection
import java.util.Date;

// Класс-утилита для работы с JWT (JSON Web Token).
@Component
public class JwtUtils {

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtUtils(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes());
    }

    // Генерирует новый JWT-токен для указанного пользователя и его ролей.
    public String generateToken(String username, Collection<String> roles) { // Modified to accept roles
        return Jwts.builder()
                .setSubject(username)
                .claim("roles", roles) // Add roles as a claim
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // Извлекает имя пользователя из JWT-токена.
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // Проверяет валидность JWT-токена для указанных данных пользователя.
    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    // Проверяет, истек ли срок действия JWT-токена.
    private boolean isTokenExpired(String token) {
        return getExpirationDate(token).before(new Date());
    }

    // Извлекает дату истечения срока действия из JWT-токена.
    private Date getExpirationDate(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
    }
}
