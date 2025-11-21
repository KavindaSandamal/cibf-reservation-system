package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for User list response (Employee Portal)
 * Used in "View All Users" page
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String businessName;
    private String contactNumber;
    private String address;
    private String role;
    private LocalDateTime createdAt;
}