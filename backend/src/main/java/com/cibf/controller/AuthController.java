package com.cibf.controller;

import com.cibf.dto.AuthRequest;
import com.cibf.dto.AuthResponse;
import com.cibf.dto.UserRegistrationRequest;
import com.cibf.dto.EmployeeRegistrationRequest;
import com.cibf.service.IAuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for all Authentication-related operations.
 * Follows:
 * - Single Responsibility Principle (SRP): Handles only authentication endpoints
 * - Dependency Inversion Principle (DIP): Depends on IAuthService abstraction
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final IAuthService authService;

    @Autowired
    public AuthController(IAuthService authService) {
        this.authService = authService;
    }

    /**
     * Register a new vendor/publisher user.
     * Endpoint: POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody UserRegistrationRequest registrationRequest) {
        AuthResponse response = authService.registerUser(registrationRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Authenticate a user (vendor or employee).
     * Can be used by both user and employee portals.
     * Endpoint: POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody AuthRequest authRequest) {
        AuthResponse response = authService.authenticateUser(authRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * Register a new employee user.
     * Endpoint: POST /api/auth/employee/register
     */
    @PostMapping("/employee/register")
    public ResponseEntity<AuthResponse> registerEmployee(@Valid @RequestBody EmployeeRegistrationRequest registrationRequest) {
        AuthResponse response = authService.registerEmployee(registrationRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Authenticate an employee specifically.
     * Validates that the user has employee role (EMPLOYEE or ADMIN).
     * Endpoint: POST /api/auth/employee/login
     */
    @PostMapping("/employee/login")
    public ResponseEntity<AuthResponse> authenticateEmployee(@Valid @RequestBody AuthRequest authRequest) {
        AuthResponse response = authService.authenticateEmployee(authRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
