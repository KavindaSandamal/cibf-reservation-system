package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Email;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmReservationRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Hold token is required")
    private String holdToken;

    @NotBlank(message = "Business name is required")
    private String businessName;

    @NotBlank(message = "User email is required")
    @Email(message = "Invalid email format")
    private String userEmail;
}