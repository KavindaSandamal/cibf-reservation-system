package com.cibf.service;

import com.cibf.config.RabbitMQConfig;
import com.cibf.dto.ReservationConfirmationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Email Consumer - Processes email sending events
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailConsumer {

    private final EmailService emailService;

    /**
     * Listen to email.queue and send emails
     */
    @RabbitListener(queues = RabbitMQConfig.EMAIL_QUEUE)
    public void handleEmailEvent(Map<String, Object> event) {
        try {
            log.info("📬 Received email event from RabbitMQ: to={}", event.get("to"));

            String to = (String) event.get("to");
            String subject = (String) event.get("subject");
            String content = (String) event.get("content");

            log.info("Sending email to: {}", to);

            // Send email using existing EmailService
            emailService.sendSimpleEmail(to, subject, content);

            log.info("✅ Email sent successfully to: {}", to);

        } catch (Exception e) {
            log.error("❌ Failed to send email", e);
            throw e; // Re-throw to send to DLQ
        }
    }
}