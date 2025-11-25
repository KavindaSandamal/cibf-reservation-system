package com.cibf.service;

import com.cibf.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * QR Code Consumer
 * Listens to qr.queue and generates QR codes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QRCodeConsumer {

    private final QRCodeService qrCodeService;

    /**
     * Listen to qr.queue and process QR generation
     */
    @RabbitListener(queues = RabbitMQConfig.QR_QUEUE)
    public void handleQRGenerationEvent(Map<String, Object> event) {
        try {
            log.info("📱 Received QR generation event from RabbitMQ: {}", event);

            String eventType = (String) event.get("eventType");
            Long reservationId = ((Number) event.get("reservationId")).longValue();
            String businessName = (String) event.get("businessName");
            String userEmail = (String) event.get("userEmail");

            log.info("Processing QR generation for reservation: {}", reservationId);

            // Generate QR code and upload to S3
            String qrCodeUrl = qrCodeService.generateAndUploadQRCode(reservationId, businessName, userEmail);

            log.info("✅ QR code generated successfully for reservation {}: {}",
                    reservationId, qrCodeUrl);

        } catch (Exception e) {
            log.error("❌ Failed to process QR generation event", e);
            throw e;
        }
    }
}