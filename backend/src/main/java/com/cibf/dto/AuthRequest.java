package com.cibf.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for receiving login credentials.
 */
@Data
public class AuthRequest {

    @NotBlank(message = "Username cannot be blank")
    private String username;

    @NotBlank(message = "Password cannot be blank")
    private String password;
}