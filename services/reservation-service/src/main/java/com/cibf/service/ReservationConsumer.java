package com.cibf.service;

import com.cibf.config.RabbitMQConfig;
import com.cibf.entity.Reservation;
import com.cibf.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationConsumer {

    private final EventPublisherService eventPublisher;
    private final ReservationRepository reservationRepository;
    private final QRCodeService qrCodeService;
    private final EmailTemplateService emailTemplateService;

    /**
     * Main consumer: Receives reservation confirmed events and orchestrates
     * email and QR generation
     */
    @RabbitListener(queues = RabbitMQConfig.RESERVATION_QUEUE)
    public void handleReservationConfirmed(Map<String, Object> event) {
        try {
            log.info("🎫 Received reservation event from RabbitMQ: {}", event);

            String eventType = (String) event.get("eventType");

            if ("RESERVATION_CONFIRMED".equals(eventType)) {
                processReservationConfirmed(event);
            } else if ("RESERVATION_CANCELLED".equals(eventType)) {
                processReservationCancelled(event);
            } else {
                log.warn("Unknown event type: {}", eventType);
            }

        } catch (Exception e) {
            log.error("❌ Failed to process reservation event", e);
            throw e; 
        }
    }

    /**
     * Process confirmed reservation: Generate QR and send email
     */
    private void processReservationConfirmed(Map<String, Object> event) {
        Long reservationId = ((Number) event.get("reservationId")).longValue();
        Long userId = ((Number) event.get("userId")).longValue();
        String userEmail = (String) event.get("userEmail");

        @SuppressWarnings("unchecked")
        List<Long> stallIds = ((List<?>) event.get("stallIds")).stream()
                .map(id -> id instanceof Long ? (Long) id : ((Number) id).longValue())
                .collect(Collectors.toList());

        log.info("Processing reservation confirmed: reservationId={}, userId={}",
                reservationId, userId);

        // Get reservation details from database
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + reservationId));

        // 1. Generate QR Code
        try {
            log.info("📱 Generating QR code for reservation {}", reservationId);

            String qrCodeUrl = qrCodeService.generateAndUploadQRCode(
                    reservationId,
                    reservation.getBusinessName(),
                    userEmail);

            // Update reservation with QR code URL
            reservation.setQrCodeUrl(qrCodeUrl);
            reservationRepository.save(reservation);

            log.info("✅ QR code generated and saved: {}", qrCodeUrl);

            // 2. Send HTML Email with QR code
            publishEmailWithQR(reservation, userEmail, qrCodeUrl, stallIds);

        } catch (Exception e) {
            log.error("❌ Failed to generate QR code for reservation {}", reservationId, e);

            // Send HTML email without QR code
            publishEmailWithoutQR(reservation, userEmail, stallIds);
        }
    }

    /**
     * Send HTML email with QR code
     */
    private void publishEmailWithQR(Reservation reservation, String userEmail,
            String qrCodeUrl, List<Long> stallIds) {
        String emailSubject = "✅ Reservation Confirmed - #" + reservation.getId();
        String htmlContent = emailTemplateService.generateConfirmationEmailWithQR(
                reservation, qrCodeUrl, stallIds);

        eventPublisher.publishEmailEvent(userEmail, emailSubject, htmlContent);
        log.info("✅ HTML email event (with QR) published for reservation {}", reservation.getId());
    }

    /**
     * Send HTML email without QR code (fallback)
     */
    private void publishEmailWithoutQR(Reservation reservation, String userEmail, List<Long> stallIds) {
        String emailSubject = "✅ Reservation Confirmed - #" + reservation.getId();
        String htmlContent = emailTemplateService.generateConfirmationEmailWithoutQR(
                reservation, stallIds);

        eventPublisher.publishEmailEvent(userEmail, emailSubject, htmlContent);
        log.info("✅ HTML email event (without QR) published for reservation {}", reservation.getId());
    }

    /**
     * Process cancelled reservation
     */
    private void processReservationCancelled(Map<String, Object> event) {
        Long reservationId = ((Number) event.get("reservationId")).longValue();

        log.info("Processing reservation cancellation: reservationId={}", reservationId);

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + reservationId));

        String emailSubject = "❌ Reservation Cancelled - #" + reservationId;
        String htmlContent = emailTemplateService.generateCancellationEmail(reservation);

        if (reservation.getUserEmail() != null) {
            eventPublisher.publishEmailEvent(reservation.getUserEmail(), emailSubject, htmlContent);
            log.info("✅ HTML cancellation email event published for reservation {}", reservationId);
        }
    }
}