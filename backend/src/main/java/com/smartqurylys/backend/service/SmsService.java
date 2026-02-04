package com.smartqurylys.backend.service;

import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// Сервис для отправки SMS-сообщений с использованием Twilio.
@Service
@RequiredArgsConstructor
public class SmsService {

    @Value("${twilio.phone.number}")
    private String twilioPhoneNumber; // Номер телефона Twilio для отправки сообщений.

    // Отправляет SMS-сообщение на указанный номер телефона.
    public void sendSms(String toPhoneNumber, String messageBody) {
        Message.creator(
                new PhoneNumber(toPhoneNumber), // Номер получателя.
                new PhoneNumber(twilioPhoneNumber), // Номер отправителя (Twilio).
                messageBody // Текст сообщения.
        ).create();

        System.out.println("📤 SMS отправлен на " + toPhoneNumber + ": " + messageBody);
    }
}
