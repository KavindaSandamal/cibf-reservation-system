package com.cibf.service;

import com.cibf.config.RabbitMQConfig;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Email Consumer - Processes email sending events and sends HTML emails
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailConsumer {

    private final JavaMailSender mailSender;

    /**
     * Listen to email.queue and send HTML emails
     */
    @RabbitListener(queues = RabbitMQConfig.EMAIL_QUEUE)
    public void handleEmailEvent(Map<String, Object> event) {
        try {
            log.info("📬 Received email event from RabbitMQ: to={}", event.get("to"));

            String to = (String) event.get("to");
            String subject = (String) event.get("subject");
            String htmlContent = (String) event.get("content");

            log.info("Sending HTML email to: {}", to);

            // Send HTML email
            sendHtmlEmail(to, subject, htmlContent);

            log.info("✅ HTML email sent successfully to: {}", to);

        } catch (Exception e) {
            log.error("❌ Failed to send email", e);
            throw new RuntimeException("Email sending failed", e); // Re-throw to send to DLQ
        }
    }

    /**
     * Send HTML email using JavaMailSender
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("info.cibf@gmail.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            log.info("📧 HTML email sent successfully to: {}", to);

        } catch (MessagingException e) {
            log.error("❌ Failed to send HTML email to: {}", to, e);
            throw e;
        }
    }
}