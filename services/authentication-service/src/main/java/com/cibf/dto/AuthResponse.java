package com.cibf.dto;

import lombok.Data;

/**
 * DTO for sending the JWT and user information back to the client.
 */
@Data
public class AuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String role;
    private String businessName;

    public AuthResponse(String accessToken, String role, String businessName) {
        this.accessToken = accessToken;
        this.role = role;
        this.businessName = businessName;
    }
}