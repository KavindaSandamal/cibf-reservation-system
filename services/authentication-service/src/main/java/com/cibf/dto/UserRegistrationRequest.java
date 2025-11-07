package com.cibf.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for registering a new vendor/publisher user.
 */
@Data
public class UserRegistrationRequest {

    @NotBlank(message = "Username (Email) is required.")
    private String username;

    @NotBlank(message = "Password is required.")
    @Size(min = 6, message = "Password must be at least 6 characters.")
    private String password;

    @NotBlank(message = "Business Name is required.")
    private String businessName;
}