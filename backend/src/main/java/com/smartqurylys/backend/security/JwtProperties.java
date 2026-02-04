package com.smartqurylys.backend.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

// Класс для загрузки свойств JWT из конфигурации приложения (например, application.properties).
@Component
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {
    private String secret; // Секретный ключ для подписи JWT.
    private long expiration; // Срок действия токена в миллисекундах.
}
