package com.smartqurylys.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Конфигурация CORS (Cross-Origin Resource Sharing).
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Разрешаем кросс-доменные запросы со следующих источников.
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:4200","http://192.168.1.132:4200", "https://journalist-newbie-simultaneously-rarely.trycloudflare.com","https://finder-author-makeup-edward.trycloudflare.com")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}