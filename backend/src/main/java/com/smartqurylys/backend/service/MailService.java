package com.smartqurylys.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

// Сервис для отправки электронной почты.
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    // Отправляет простое текстовое электронное письмо.
    public void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("gkey2014@gmail.com"); // Указываем отправителя.
            message.setTo(to); // Указываем получателя.
            message.setSubject(subject); // Устанавливаем тему письма.
            message.setText(body); // Устанавливаем текст письма.
            mailSender.send(message); // Отправляем письмо.
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e); // Обрабатываем возможные ошибки при отправке.
        }
    }
}
