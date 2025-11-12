package com.cibf.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * DTO for employee registration request.
 * The role will be implicitly set to EMPLOYEE by the service layer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRegistrationRequest {

    // --- User Account Fields ---
    
    @NotBlank(message = "Username (email) is required")
    @Email(message = "Username must be a valid email format")
    private String username; 

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    
    // --- Employee Profile Fields ---

    @NotBlank(message = "Employee name is required")
    private String name;

    @NotBlank(message = "Employee email is required")
    @Email(message = "Email must be a valid email format")
    private String email; 

    @NotBlank(message = "Employee ID is required")
    private String employeeId;
    
    private String contactNumber;

    private String department; 
}