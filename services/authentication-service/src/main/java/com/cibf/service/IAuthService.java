package com.cibf.service;

import com.cibf.dto.AuthRequest;
import com.cibf.dto.AuthResponse;
import com.cibf.dto.UserRegistrationRequest;
import com.cibf.dto.EmployeeRegistrationRequest;
import org.springframework.http.ResponseEntity;

/**
 * Interface for authentication service operations.
 * Follows:
 * - Dependency Inversion Principle (DIP): Clients depend on abstraction, not concrete implementation
 * - Interface Segregation Principle (ISP): Focused interface with specific responsibilities
 */
public interface IAuthService {

    /**
     * Register a new vendor/publisher user.
     * 
     * @param registrationRequest User registration details
     * @return AuthResponse containing JWT token and user info
     */
    AuthResponse registerUser(UserRegistrationRequest registrationRequest);

    /**
     * Authenticate a user (vendor or employee) and return JWT token.
     * 
     * @param authRequest Login credentials
     * @return AuthResponse containing JWT token and user info
     */
    AuthResponse authenticateUser(AuthRequest authRequest);

    /**
     * Authenticate an employee specifically.
     * Provides clearer separation for employee portal.
     * 
     * @param authRequest Employee login credentials
     * @return AuthResponse containing JWT token and employee info
     */
    AuthResponse authenticateEmployee(AuthRequest authRequest);

    /**
     * Register a new employee user.
     * 
     * @param registrationRequest Employee registration details
     * @return AuthResponse containing JWT token and employee info
     */
    AuthResponse registerEmployee(EmployeeRegistrationRequest registrationRequest);

    /**
     * Admin creates a new employee (without auto-login).
     * Used when admin creates employee accounts.
     * 
     * @param registrationRequest Employee registration details
     * @return ResponseEntity with created employee information
     */
    ResponseEntity<?> createEmployeeByAdmin(EmployeeRegistrationRequest registrationRequest);

    /**
     * Admin creates a new user/vendor (without auto-login).
     * Used when admin creates user accounts.
     * 
     * @param registrationRequest User registration details
     * @return ResponseEntity with created user information
     */
    ResponseEntity<?> createUserByAdmin(UserRegistrationRequest registrationRequest);
}