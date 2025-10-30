package com.cibf.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin/Employee-only controller for demonstration of role-based authorization.
 * Follows:
 * - Single Responsibility Principle (SRP): Handles admin operations only
 * - Role-based access control using @PreAuthorize annotations
 * 
 * This is a placeholder controller to demonstrate authorization.
 * Full implementation will be added when building stall management.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    /**
     * Example endpoint accessible only to employees (EMPLOYEE or ADMIN roles).
     * Demonstrates method-level security using Spring Security annotations.
     * 
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
     * Example endpoint accessible only to ADMIN role.
     * Demonstrates strict role-based access control.
     */
    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> getSettings() {
        // TODO: Implement admin settings
        return new ResponseEntity<>("Admin Settings - Access Granted", HttpStatus.OK);
    }

    /**
     * Example endpoint for vendors - demonstrates how to restrict to specific roles.
     * This would typically be in a separate VendorController.
     */
    @GetMapping("/vendor/profile")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<String> getVendorProfile() {
        // TODO: Implement vendor profile
        return new ResponseEntity<>("Vendor Profile - Access Granted", HttpStatus.OK);
    }
}

