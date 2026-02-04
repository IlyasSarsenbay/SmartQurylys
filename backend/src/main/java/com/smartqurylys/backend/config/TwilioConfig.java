package com.smartqurylys.backend.config;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

// Конфигурация для интеграции с Twilio.
@Configuration
@RequiredArgsConstructor
public class TwilioConfig {

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    // Инициализация Twilio SDK при старте приложения.
    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }
}
