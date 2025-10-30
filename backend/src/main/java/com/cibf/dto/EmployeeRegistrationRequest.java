package com.cibf.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for employee registration.
 */
@Data
public class EmployeeRegistrationRequest {

    @NotBlank
    @Email
    private String username; // used as login username/email

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String employeeId;

    // Optional organizational role label (e.g., ADMIN, STAFF). Defaults applied in service.
    private String role;
}


