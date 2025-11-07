package com.cibf.service;

import com.cibf.dto.AuthRequest;
import com.cibf.dto.AuthResponse;
import com.cibf.dto.EmployeeRegistrationRequest;
import com.cibf.dto.UserRegistrationRequest;
import com.cibf.entity.User;
import com.cibf.entity.Employee;
import com.cibf.entity.Role;
import com.cibf.repository.UserRepository;
import com.cibf.repository.EmployeeRepository;
import com.cibf.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service implementation for authentication operations.
 * Follows:
 * - Single Responsibility Principle (SRP): Handles authentication only
 * - Dependency Inversion Principle (DIP): Depends on IAuthService interface
 * - Open/Closed Principle: Easy to extend with new authentication methods
 */
@Service
public class AuthService implements IAuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmployeeRepository employeeRepository;

    @Autowired
    public AuthService(AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            EmployeeRepository employeeRepository) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.employeeRepository = employeeRepository;
    }

    @Override
    public AuthResponse registerUser(UserRegistrationRequest registrationRequest) {
        validateUsernameAvailability(registrationRequest.getUsername());

        User user = new User(
                registrationRequest.getUsername(),
                passwordEncoder.encode(registrationRequest.getPassword()),
                registrationRequest.getBusinessName(),
                Role.VENDOR); // Use enum for type safety

        userRepository.save(user);

        Authentication authentication = performAuthentication(
                registrationRequest.getUsername(),
                registrationRequest.getPassword());
        
        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(token, user.getRole(), user.getBusinessName());
    }

    @Override
    public AuthResponse authenticateUser(AuthRequest authRequest) {
        Authentication authentication = performAuthentication(
                authRequest.getUsername(),
                authRequest.getPassword());

        User user = findUserByUsername(authRequest.getUsername());
        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(token, user.getRole(), user.getBusinessName());
    }

    @Override
    public AuthResponse authenticateEmployee(AuthRequest authRequest) {
        Authentication authentication = performAuthentication(
                authRequest.getUsername(),
                authRequest.getPassword());

        User user = findUserByUsername(authRequest.getUsername());
        
        // Validate that the user is actually an employee
        if (!user.isEmployee()) {
            throw new BadCredentialsException("Access denied. Employee credentials required.");
        }

        String token = tokenProvider.generateToken(authentication);
        return new AuthResponse(token, user.getRole(), user.getBusinessName());
    }

    @Override
    public AuthResponse registerEmployee(EmployeeRegistrationRequest registrationRequest) {
        validateUsernameAvailability(registrationRequest.getUsername());

        // Determine role - default to EMPLOYEE if not specified
        Role effectiveRole = determineEmployeeRole(registrationRequest.getRole());

        User user = new User(
                registrationRequest.getUsername(),
                passwordEncoder.encode(registrationRequest.getPassword()),
                null,
                effectiveRole); // Use enum for type safety

        userRepository.save(user);

        Employee employee = createEmployee(registrationRequest, user, effectiveRole);
        employeeRepository.save(employee);

        Authentication authentication = performAuthentication(
                registrationRequest.getUsername(),
                registrationRequest.getPassword());
        
        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(token, effectiveRole.getName(), null);
    }

    /**
     * Private helper method to validate username availability.
     * Encapsulation - hides validation logic.
     */
    private void validateUsernameAvailability(String username) {
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is already taken.");
        }
    }

    /**
     * Private helper method to perform authentication.
     * Single Responsibility - handles authentication logic only.
     */
    private Authentication performAuthentication(String username, String password) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            return authentication;
        } catch (BadCredentialsException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials.");
        }
    }

    /**
     * Private helper method to find user by username.
     * Encapsulation - centralizes user lookup logic.
     */
    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "User not found after authentication."));
    }

    /**
     * Determine employee role from request.
     * Defaults to EMPLOYEE if not specified or invalid.
     * Open/Closed Principle - easy to add new roles.
     */
    private Role determineEmployeeRole(String roleString) {
        if (roleString == null || roleString.isBlank()) {
            return Role.EMPLOYEE;
        }
        
        Role role = Role.fromString(roleString);
        return (role != null && (role == Role.EMPLOYEE || role == Role.ADMIN)) 
                ? role 
                : Role.EMPLOYEE;
    }

    /**
     * Create Employee entity from registration request.
     * Factory method pattern - encapsulates object creation.
     */
    private Employee createEmployee(EmployeeRegistrationRequest request, User user, Role role) {
        Employee employee = new Employee();
        employee.setUser(user);
        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setEmployeeId(request.getEmployeeId());
        employee.setRole(role.getName());
        return employee;
    }
}