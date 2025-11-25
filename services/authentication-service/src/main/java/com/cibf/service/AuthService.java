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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

/**
 * Service implementation for authentication operations.
 * FIXED: Now generates JWT tokens with roles included
 */
@Service
public class AuthService implements IAuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

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

        // Create user with all fields
        User user = new User(
                registrationRequest.getUsername(),
                passwordEncoder.encode(registrationRequest.getPassword()),
                registrationRequest.getBusinessName(),
                registrationRequest.getUsername(),
                registrationRequest.getContactNumber(),
                registrationRequest.getAddress(),
                Role.VENDOR);

        userRepository.save(user);
        logger.info("User registered: {}", user.getUsername());

        // Authenticate and generate token with roles
        Authentication authentication = performAuthentication(
                registrationRequest.getUsername(),
                registrationRequest.getPassword());

        // Generate token with authentication (includes roles)
        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(token, user.getRole(), user.getBusinessName());
    }

    @Override
    public AuthResponse authenticateUser(AuthRequest authRequest) {
        // Authenticate first
        Authentication authentication = performAuthentication(
                authRequest.getUsername(),
                authRequest.getPassword());

        User user = findUserByUsername(authRequest.getUsername());

        // Generate token with authentication (includes roles)
        String token = tokenProvider.generateToken(authentication);

        logger.info("User authenticated: {} with role: {}", user.getUsername(), user.getRole());

        return new AuthResponse(token, user.getRole(), user.getBusinessName());
    }

    @Override
    public AuthResponse authenticateEmployee(AuthRequest authRequest) {
        // Authenticate first
        Authentication authentication = performAuthentication(
                authRequest.getUsername(),
                authRequest.getPassword());

        User user = findUserByUsername(authRequest.getUsername());

        // Validate that the user is actually an employee
        if (!user.isEmployee()) {
            logger.warn("Non-employee user attempted to access employee portal: {}", user.getUsername());
            throw new BadCredentialsException("Access denied. Employee credentials required.");
        }

        // Generate token with authentication (includes roles)
        String token = tokenProvider.generateToken(authentication);

        logger.info("Employee authenticated: {} with role: {}", user.getUsername(), user.getRole());

        return new AuthResponse(token, user.getRole(), user.getBusinessName());
    }

    @Override
    public AuthResponse registerEmployee(EmployeeRegistrationRequest registrationRequest) {
        validateUsernameAvailability(registrationRequest.getUsername());

        // Role is fixed to EMPLOYEE for self-registration for security reasons.
        Role effectiveRole = Role.EMPLOYEE;

        // Create User record in users table
        User user = new User(
                registrationRequest.getUsername(),
                passwordEncoder.encode(registrationRequest.getPassword()),
                "CIBF Employee",
                registrationRequest.getEmail(),
                registrationRequest.getContactNumber(),
                null,
                effectiveRole);

        userRepository.save(user);
        logger.info("Employee user created: {}", user.getUsername());

        Employee employee = createEmployee(registrationRequest, user, effectiveRole);
        employeeRepository.save(employee);
        logger.info("Employee record created: {} ({})", employee.getName(), employee.getEmployeeId());

        // Authenticate and generate token with roles
        Authentication authentication = performAuthentication(
                registrationRequest.getUsername(),
                registrationRequest.getPassword());

        // Generate token with authentication (includes roles)
        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(token, effectiveRole.getName(), null);
    }

    /**
     * Private helper method to validate username availability.
     */
    private void validateUsernameAvailability(String username) {
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is already taken.");
        }
    }

    /**
     * Private helper method to perform authentication.
     */
    private Authentication performAuthentication(String username, String password) {
        try {
            logger.debug("Attempting authentication for user: {}", username);

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Log the authorities for debugging
            logger.debug("Authentication successful for user: {} with authorities: {}",
                    username, authentication.getAuthorities());

            return authentication;
        } catch (BadCredentialsException e) {
            logger.warn("Authentication failed for user: {} - Invalid credentials", username);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials.");
        }
    }

    /**
     * Private helper method to find user by username.
     */
    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "User not found after authentication."));
    }

    /**
     * Determine employee role from request.
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
     */
    private Employee createEmployee(EmployeeRegistrationRequest request, User user, Role role) {
        Employee employee = new Employee();
        employee.setUser(user);
        employee.setUsername(user.getUsername());
        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setEmployeeId(request.getEmployeeId());
        employee.setRole(role.getName());
        employee.setContactNumber(request.getContactNumber());
        employee.setDepartment(request.getDepartment());
        return employee;
    }

    /**
     * Admin creates a new employee (without auto-login).
     */
    @Override
    public ResponseEntity<?> createEmployeeByAdmin(EmployeeRegistrationRequest registrationRequest) {
        validateUsernameAvailability(registrationRequest.getUsername());

        Role effectiveRole = Role.EMPLOYEE;

        User user = new User(
                registrationRequest.getUsername(),
                passwordEncoder.encode(registrationRequest.getPassword()),
                "CIBF Admin",
                registrationRequest.getEmail(),
                registrationRequest.getContactNumber(),
                null,
                effectiveRole);

        userRepository.save(user);

        Employee employee = createEmployee(registrationRequest, user, effectiveRole);
        employeeRepository.save(employee);

        logger.info("Employee created by admin: {} ({})", employee.getName(), employee.getEmployeeId());

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("role", effectiveRole.getName());
        response.put("employeeId", employee.getEmployeeId());
        response.put("name", employee.getName());
        response.put("email", employee.getEmail());
        response.put("message", "Employee created successfully by admin");

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Admin creates a new user/vendor (without auto-login).
     */
    @Override
    public ResponseEntity<?> createUserByAdmin(UserRegistrationRequest registrationRequest) {
        validateUsernameAvailability(registrationRequest.getUsername());

        User user = new User(
                registrationRequest.getUsername(),
                passwordEncoder.encode(registrationRequest.getPassword()),
                registrationRequest.getBusinessName(),
                registrationRequest.getUsername(),
                registrationRequest.getContactNumber(),
                registrationRequest.getAddress(),
                Role.VENDOR);

        userRepository.save(user);

        logger.info("User created by admin: {} ({})", user.getUsername(), user.getBusinessName());

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("businessName", user.getBusinessName());
        response.put("email", user.getEmail());
        response.put("message", "User created successfully by admin");

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @Override
    public boolean userExists(Long userId) {
        return userRepository.existsById(userId);
    }

    @Override
    public User getUserByUsername(String username) {
        return findUserByUsername(username);
    }
}