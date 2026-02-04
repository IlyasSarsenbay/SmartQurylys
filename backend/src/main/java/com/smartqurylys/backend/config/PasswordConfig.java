package com.smartqurylys.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// Конфигурация для шифрования паролей.
@Configuration
public class PasswordConfig {

    // Определяем BCryptPasswordEncoder как основной кодировщик паролей.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
