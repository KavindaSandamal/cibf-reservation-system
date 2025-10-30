package com.cibf.service;

import com.cibf.dto.AuthRequest;
import com.cibf.dto.AuthResponse;
import com.cibf.dto.UserRegistrationRequest;
import com.cibf.dto.EmployeeRegistrationRequest;

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
}