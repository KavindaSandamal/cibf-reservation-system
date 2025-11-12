package com.cibf.reservation.dto;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;

@Data
@Builder
public class ReservationResponse {
    private Long id;
    private Long userId;
    private Long stallId;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private String qrCodeUrl;
}
