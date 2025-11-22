package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for sending reservation confirmation email
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationConfirmationDto {

    private Long reservationId;
    private String userEmail;
    private String businessName;
    private List<StallInfo> stalls;
    private BigDecimal totalAmount;
    private String qrCodeUrl;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StallInfo {
        private Long id;
        private String stallName;
        private String size;
        private String dimension;
        private BigDecimal price;
    }
}