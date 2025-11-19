package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {

    private Long id;
    private Long userId;
    private Long stallId;
    private String userEmail;
    private String businessName;
    private String status;
    private BigDecimal totalAmount;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private String qrCodeUrl;
    private List<StallSummary> stalls;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StallSummary {
        private Long id;
        private String stallName;
        private String size;
        private String dimension;
        private BigDecimal price;
    }
}