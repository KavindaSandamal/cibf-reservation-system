package com.cibf.reservation.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmReservationRequest {

    @NotBlank(message = "Hold token is required")
    private String holdToken;

    @NotNull(message = "User ID is required")
    private Long userId;
}
