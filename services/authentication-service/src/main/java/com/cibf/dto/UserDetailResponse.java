package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for detailed user information (Employee Portal)
 * Used in "User Detail" page
 * Includes user's reservation history
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailResponse {
    private Long id;
    private String email;
    private String businessName;
    private String contactNumber;
    private String address;
    private String role;
    private LocalDateTime createdAt;
    
    // Reservation history from Reservation Service
    private List<ReservationResponse> reservations;
    
    // Statistics
    private Integer totalReservations;
    private Integer activeReservations;
}