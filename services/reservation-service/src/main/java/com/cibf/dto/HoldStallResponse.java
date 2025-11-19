package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HoldStallResponse {

    private String holdToken;
    private LocalDateTime expiresAt;
    private String message;

    // Constructor for backward compatibility
    public HoldStallResponse(String holdToken, LocalDateTime expiresAt) {
        this.holdToken = holdToken;
        this.expiresAt = expiresAt;
        this.message = "Stalls held successfully. Please confirm within 5 minutes.";
    }
}