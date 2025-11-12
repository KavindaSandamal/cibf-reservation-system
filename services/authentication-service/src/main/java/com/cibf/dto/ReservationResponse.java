package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Reservation data (from Reservation Service)
 * Used when displaying user's reservation history
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {
    private Long id;
    private String userEmail;
    private String businessName;
    private LocalDateTime reservationDate;
    private String status;
    private BigDecimal totalAmount;
    private String qrCodeUrl;
    private List<StallInfo> stalls;
    private LocalDateTime createdAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StallInfo {
        private Long id;
        private String stallName;
        private String size;
        private BigDecimal price;
    }
}