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
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

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
     * Endpoint for vendors - demonstrates how to restrict to specific roles.
     */
    @GetMapping("/vendor/profile")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<String> getVendorProfile() {
        // TODO: Implement vendor profile
        return new ResponseEntity<>("Vendor Profile - Access Granted", HttpStatus.OK);
    }
}

