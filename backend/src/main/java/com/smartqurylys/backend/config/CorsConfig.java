package com.smartqurylys.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Применяем CORS ко всем путям
                        .allowedOrigins("http://localhost:4200") // Разрешаем запросы с вашего Angular фронтенда
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS") // Разрешенные HTTP методы
                        .allowedHeaders("*") // Разрешенные заголовки
                        .allowCredentials(true); // Разрешаем отправку куки и заголовков авторизации
            }
        };
    }
}