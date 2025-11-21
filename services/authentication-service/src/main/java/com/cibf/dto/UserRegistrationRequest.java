package com.cibf.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user registration request
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRegistrationRequest {
    
    @NotBlank(message = "Username is required")
    @Email(message = "Username must be a valid email")
    private String username;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @NotBlank(message = "Business name is required")
    private String businessName;
    
    // Optional fields (can be null)
    private String contactNumber;
    
    private String address;
}