package com.smartqurylys.backend;

import com.smartqurylys.backend.security.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

// Главный класс приложения.
@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class BackendApplication {

    // Точка входа в приложение.
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}

