package com.cibf.controller;

import com.cibf.service.EventPublisherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test/rabbitmq")
@RequiredArgsConstructor
@Slf4j
public class RabbitMQTestController {
    
    private final RabbitTemplate rabbitTemplate;
    private final EventPublisherService eventPublisher;
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> checkHealth() {
        try {
            rabbitTemplate.getConnectionFactory().createConnection().close();
            return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "message", "RabbitMQ connection is working"
            ));
        } catch (Exception e) {
            log.error("RabbitMQ health check failed", e);
            return ResponseEntity.status(500).body(Map.of(
                "status", "unhealthy",
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/test-reservation")
    public ResponseEntity<Map<String, String>> testReservation() {
        try {
            eventPublisher.publishReservationConfirmed(
                999L,
                1L,
                "test@example.com",
                List.of(1L, 2L, 3L)
            );
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Reservation event published - check RabbitMQ UI"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/test-email")
    public ResponseEntity<Map<String, String>> testEmail() {
        try {
            eventPublisher.publishEmailEvent(
                "test@example.com",
                "Test Email from RabbitMQ",
                "This is a test email sent via RabbitMQ"
            );
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Email event published - check logs"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/test-qr")
    public ResponseEntity<Map<String, String>> testQR() {
        try {
            eventPublisher.publishQRGenerationEvent(
                999L,
                "RESERVATION:999:USER:1"
            );
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "QR generation event published - check logs"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }
}