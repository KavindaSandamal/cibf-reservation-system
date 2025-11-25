package com.cibf.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.cibf.entity.ReservationStatus;

import jakarta.persistence.*;

import java.beans.Transient;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Reservation Entity
 * Represents a stall reservation by a vendor
 */
@Entity
@Table(name = "reservations", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_stall_id", columnList = "stall_id"),
        @Index(name = "idx_hold_token", columnList = "hold_token"),
        @Index(name = "idx_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Column(name = "business_name", nullable = false, length = 255)
    private String businessName;

    @Column(name = "stall_id", nullable = false)
    private Long stallId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservationStatus status;

    @Column(name = "hold_token", unique = true, length = 100)
    private String holdToken;

    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "qr_code_url", length = 500)
    private String qrCodeUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;


    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_by")
    private String cancelledBy;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    /**
     * Check if reservation is active (PENDING or CONFIRMED)
     */
    @Transient
    public boolean isActive() {
        return status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
    }

    /**
     * Check if hold has expired
     */
    @Transient
    public boolean isHoldExpired() {
        return status == ReservationStatus.PENDING
                && holdExpiresAt != null
                && holdExpiresAt.isBefore(LocalDateTime.now());
    }

    /**
     * Check if reservation can be cancelled
     */
    @Transient
    public boolean canBeCancelled() {
        return status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
    }
}