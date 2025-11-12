package com.cibf.reservation.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class HoldStallResponse {
    private String holdToken;
    private LocalDateTime expiresAt;
}