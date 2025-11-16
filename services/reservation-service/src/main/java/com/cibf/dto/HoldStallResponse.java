package com.cibf.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class HoldStallResponse {
    private String holdToken;
    private LocalDateTime expiresAt;
}