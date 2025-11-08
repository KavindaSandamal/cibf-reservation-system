package com.cibf.controller;

import com.cibf.dto.EmployeeRegistrationRequest;
import com.cibf.dto.UserRegistrationRequest;
import com.cibf.service.IAuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin/Employee-only controller for demonstration of role-based authorization.
 * Follows:
 * - Single Responsibility Principle (SRP): Handles admin operations only
 * - Role-based access control using @PreAuthorize annotations
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final IAuthService authService;

    @Autowired
    public AdminController(IAuthService authService) {
        this.authService = authService;
    }

    /**
     * Endpoint accessible only to employees (EMPLOYEE or ADMIN roles).
     * @PreAuthorize uses SpEL (Spring Expression Language) to check authorities.
     * The expression checks if the authenticated user has ROLE_EMPLOYEE or ROLE_ADMIN.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<String> getDashboard() {
        // TODO: Implement dashboard statistics
        return new ResponseEntity<>("Employee Dashboard - Access Granted", HttpStatus.OK);
    }

    /**
     * Endpoint accessible only to ADMIN role.
     * Demonstrates strict role-based access control.
     */
    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> getSettings() {
        // TODO: Implement admin settings
        return new ResponseEntity<>("Admin Settings - Access Granted", HttpStatus.OK);
    }

    /**
     * Admin endpoint to create a new employee.
     * Only ADMIN role can access this endpoint.
     * 
     * @param registrationRequest Employee registration details
     * @return Created employee information (without JWT token)
     */
    @PostMapping("/employees")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createEmployee(@Valid @RequestBody EmployeeRegistrationRequest registrationRequest) {
        // Admin creates employee - no auto-login, just create the account
        return authService.createEmployeeByAdmin(registrationRequest);
    }

    /**
     * Admin endpoint to create a new vendor/user.
     * Only ADMIN role can access this endpoint.
     * 
     * @param registrationRequest User registration details
     * @return Created user information (without JWT token)
     */
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserRegistrationRequest registrationRequest) {
        // Admin creates user - no auto-login, just create the account
        return authService.createUserByAdmin(registrationRequest);
    }

    /**
     * Endpoint for vendors - demonstrates how to restrict to specific roles.
     */
    @GetMapping("/vendor/profile")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<String> getVendorProfile() {
        // TODO: Implement vendor profile
        return new ResponseEntity<>("Vendor Profile - Access Granted", HttpStatus.OK);
    }
}

