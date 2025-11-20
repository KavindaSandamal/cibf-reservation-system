package com.cibf.service;

import com.cibf.config.RabbitMQConfig;
import com.cibf.dto.ReservationConfirmationDto;
import com.cibf.entity.Reservation;
import com.cibf.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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
            throw e; // Re-throw to send to DLQ
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
        List<Long> stallIds = (List<Long>) event.get("stallIds");

        log.info("Processing reservation confirmed: reservationId={}, userId={}",
                reservationId, userId);

        // Get reservation details from database
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + reservationId));

        // 1. Generate QR Code
        try {
            log.info("📱 Generating QR code for reservation {}", reservationId);

            String qrData = String.format("RESERVATION:%d:USER:%d:STALLS:%s",
                    reservationId, userId, stallIds.stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(",")));

            String qrCodeUrl = qrCodeService.generateAndUploadQRCode(
                    reservationId,
                    reservation.getBusinessName(),
                    userEmail);

            // Update reservation with QR code URL
            reservation.setQrCodeUrl(qrCodeUrl);
            reservationRepository.save(reservation);

            log.info("✅ QR code generated and saved: {}", qrCodeUrl);

            // 2. Send Email with QR code
            publishEmailWithQR(reservation, userEmail, qrCodeUrl, stallIds);

        } catch (Exception e) {
            log.error("❌ Failed to generate QR code for reservation {}", reservationId, e);

            // Send email without QR code
            publishEmailWithoutQR(reservation, userEmail, stallIds);
        }
    }

    /**
     * Send email with QR code
     */
    private void publishEmailWithQR(Reservation reservation, String userEmail,
            String qrCodeUrl, List<Long> stallIds) {
        String emailSubject = "✅ Reservation Confirmed - #" + reservation.getId();
        String emailContent = String.format(
                "Dear %s,\n\n" +
                        "Your reservation has been confirmed!\n\n" +
                        "📋 Reservation Details:\n" +
                        "   - Reservation ID: %d\n" +
                        "   - Business Name: %s\n" +
                        "   - Stall IDs: %s\n" +
                        "   - Total Amount: $%.2f\n\n" +
                        "📱 Your QR Code: %s\n\n" +
                        "Please present this QR code at the venue.\n\n" +
                        "Thank you for your reservation!\n\n" +
                        "Best regards,\n" +
                        "CIBF Reservation Team",
                reservation.getBusinessName(),
                reservation.getId(),
                reservation.getBusinessName(),
                stallIds.stream().map(String::valueOf).collect(Collectors.joining(", ")),
                reservation.getTotalAmount(),
                qrCodeUrl);

        eventPublisher.publishEmailEvent(userEmail, emailSubject, emailContent);
        log.info("✅ Email event (with QR) published for reservation {}", reservation.getId());
    }

    /**
     * Send email without QR code (fallback)
     */
    private void publishEmailWithoutQR(Reservation reservation, String userEmail, List<Long> stallIds) {
        String emailSubject = "✅ Reservation Confirmed - #" + reservation.getId();
        String emailContent = String.format(
                "Dear %s,\n\n" +
                        "Your reservation has been confirmed!\n\n" +
                        "📋 Reservation Details:\n" +
                        "   - Reservation ID: %d\n" +
                        "   - Business Name: %s\n" +
                        "   - Stall IDs: %s\n" +
                        "   - Total Amount: $%.2f\n\n" +
                        "⚠️ Your QR code is being generated and will be sent separately.\n\n" +
                        "Thank you for your reservation!\n\n" +
                        "Best regards,\n" +
                        "CIBF Reservation Team",
                reservation.getBusinessName(),
                reservation.getId(),
                reservation.getBusinessName(),
                stallIds.stream().map(String::valueOf).collect(Collectors.joining(", ")),
                reservation.getTotalAmount());

        eventPublisher.publishEmailEvent(userEmail, emailSubject, emailContent);
        log.info("✅ Email event (without QR) published for reservation {}", reservation.getId());
    }

    /**
     * Process cancelled reservation
     */
    private void processReservationCancelled(Map<String, Object> event) {
        Long reservationId = ((Number) event.get("reservationId")).longValue();
        Long userId = ((Number) event.get("userId")).longValue();

        log.info("Processing reservation cancellation: reservationId={}", reservationId);

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + reservationId));

        String emailSubject = "❌ Reservation Cancelled - #" + reservationId;
        String emailContent = String.format(
                "Dear %s,\n\n" +
                        "Your reservation (ID: %d) has been cancelled.\n\n" +
                        "If you did not request this cancellation, please contact support.\n\n" +
                        "Best regards,\n" +
                        "CIBF Reservation Team",
                reservation.getBusinessName(),
                reservationId);

        if (reservation.getUserEmail() != null) {
            eventPublisher.publishEmailEvent(reservation.getUserEmail(), emailSubject, emailContent);
            log.info("✅ Cancellation email event published for reservation {}", reservationId);
        }
    }
}