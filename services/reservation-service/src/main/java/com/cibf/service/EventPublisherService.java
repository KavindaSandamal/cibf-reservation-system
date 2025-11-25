package com.cibf.service;

import com.cibf.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisherService {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Publish reservation confirmed event
     * This will trigger email sending and QR code generation asynchronously
     */
    public void publishReservationConfirmed(Long reservationId, Long userId,
            String userEmail, List<Long> stallIds) {
        try {
            log.info("📤 Publishing ReservationConfirmed event to RabbitMQ: reservationId={}", reservationId);

            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "RESERVATION_CONFIRMED");
            event.put("reservationId", reservationId);
            event.put("userId", userId);
            event.put("userEmail", userEmail);
            event.put("stallIds", stallIds);
            event.put("timestamp", LocalDateTime.now().toString());

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.RESERVATION_EXCHANGE,
                    RabbitMQConfig.RESERVATION_CONFIRMED_KEY,
                    event);

            log.info("✅ ReservationConfirmed event published successfully to RabbitMQ");

        } catch (Exception e) {
            log.error("❌ Failed to publish ReservationConfirmed event to RabbitMQ", e);
            throw e; 
        }
    }

    /**
     * Publish reservation held event
     */
    public void publishReservationHeld(Long userId, List<Long> stallIds,
            String holdToken, LocalDateTime expiresAt) {
        try {
            log.info("📤 Publishing ReservationHeld event: userId={}", userId);

            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "RESERVATION_HELD");
            event.put("userId", userId);
            event.put("stallIds", stallIds);
            event.put("holdToken", holdToken);
            event.put("expiresAt", expiresAt.toString());
            event.put("timestamp", LocalDateTime.now().toString());

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.RESERVATION_EXCHANGE,
                    "reservation.held",
                    event);

            log.info("✅ ReservationHeld event published");

        } catch (Exception e) {
            log.error("⚠️ Failed to publish ReservationHeld event", e);
        }
    }

    /**
     * Publish reservation cancelled event
     */
    public void publishReservationCancelled(Long reservationId, Long userId, Long stallId) {
        try {
            log.info("📤 Publishing ReservationCancelled event: reservationId={}", reservationId);

            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "RESERVATION_CANCELLED");
            event.put("reservationId", reservationId);
            event.put("userId", userId);
            event.put("stallId", stallId);
            event.put("timestamp", LocalDateTime.now().toString());

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.RESERVATION_EXCHANGE,
                    RabbitMQConfig.RESERVATION_CANCELLED_KEY,
                    event);

            log.info("✅ ReservationCancelled event published");

        } catch (Exception e) {
            log.error("⚠️ Failed to publish ReservationCancelled event", e);
        }
    }

    /**
     * Publish email event directly (internal use by consumers)
     */
    public void publishEmailEvent(String to, String subject, String content) {
        try {
            log.info("📤 Publishing Email event: to={}", to);

            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "EMAIL_SEND");
            event.put("to", to);
            event.put("subject", subject);
            event.put("content", content);
            event.put("timestamp", LocalDateTime.now().toString());

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.RESERVATION_EXCHANGE,
                    RabbitMQConfig.EMAIL_SEND_KEY,
                    event);

            log.info("✅ Email event published");

        } catch (Exception e) {
            log.error("❌ Failed to publish Email event", e);
        }
    }

    /**
     * Publish QR generation event directly (internal use by consumers)
     */
    public void publishQRGenerationEvent(Long reservationId, String qrData) {
        try {
            log.info("📤 Publishing QR generation event: reservationId={}", reservationId);

            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "QR_GENERATE");
            event.put("reservationId", reservationId);
            event.put("qrData", qrData);
            event.put("timestamp", LocalDateTime.now().toString());

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.RESERVATION_EXCHANGE,
                    RabbitMQConfig.QR_GENERATE_KEY,
                    event);

            log.info("✅ QR generation event published");

        } catch (Exception e) {
            log.error("❌ Failed to publish QR generation event", e);
        }
    }
}