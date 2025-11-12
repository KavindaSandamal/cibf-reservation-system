package com.cibf.controller;

import com.cibf.dto.EmployeeRegistrationRequest;
import com.cibf.dto.UserRegistrationRequest;
import com.cibf.dto.UserResponse;
import com.cibf.dto.UserDetailResponse;
import com.cibf.entity.User;
import com.cibf.service.IAuthService;
import com.cibf.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin/Employee-only controller for employee portal operations.
 * Follows:
 * - Single Responsibility Principle (SRP): Handles admin operations only
 * - Role-based access control using @PreAuthorize annotations
 * 
 * Endpoints for Employee Portal:
 * - User management (view all users, search, view details)
 * - Employee creation
 * - Dashboard access
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") // Allow frontend access
public class AdminController {

    private final IAuthService authService;
    private final UserManagementService userManagementService;

    @Autowired
    public AdminController(IAuthService authService, UserManagementService userManagementService) {
        this.authService = authService;
        this.userManagementService = userManagementService;
    }

    // ==================== DASHBOARD ====================

    /**
     * Employee Dashboard - Main landing page after login
     * Accessible to both EMPLOYEE and ADMIN roles
     * 
     * @return Dashboard welcome message
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Employee Dashboard - Access Granted");
        response.put("timestamp", System.currentTimeMillis());
        
        // Get basic statistics
        long totalUsers = userManagementService.getTotalUsersCount();
        response.put("totalUsers", totalUsers);
        
        return ResponseEntity.ok(response);
    }

    // ==================== USER MANAGEMENT ====================

    /**
     * Get all registered users/vendors
     * Supports search and pagination
     * 
     * Employee Portal Usage: "View All Users" page
     * 
     * @param search Optional search query (business name, email)
     * @param page Page number (default: 0)
     * @param size Page size (default: 10)
     * @return Paginated list of users
     */
    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponse> users;
        
        if (search != null && !search.trim().isEmpty()) {
            users = userManagementService.searchUsers(search, pageable);
        } else {
            users = userManagementService.getAllUsers(pageable);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("users", users.getContent());
        response.put("currentPage", users.getNumber());
        response.put("totalItems", users.getTotalElements());
        response.put("totalPages", users.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get specific user details by ID
     * Includes user profile and reservation history
     * 
     * Employee Portal Usage: "User Detail" page
     * 
     * @param id User ID
     * @return User details with reservation history
     */
    @GetMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<UserDetailResponse> getUserById(@PathVariable Long id) {
        UserDetailResponse userDetail = userManagementService.getUserDetailById(id);
        return ResponseEntity.ok(userDetail);
    }

    /**
     * Get user statistics
     * 
     * Employee Portal Usage: Dashboard statistics
     * 
     * @return User statistics (total count, recent registrations, etc.)
     */
    @GetMapping("/users/statistics")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStatistics() {
        Map<String, Object> stats = userManagementService.getUserStatistics();
        return ResponseEntity.ok(stats);
    }

    // ==================== EMPLOYEE MANAGEMENT (ADMIN ONLY) ====================

    /**
     * Create a new employee account
     * Only ADMIN role can access this endpoint
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
     * Create a new vendor/user account
     * Only ADMIN role can access this endpoint
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

    // ==================== SETTINGS (ADMIN ONLY) ====================

    /**
     * Admin settings page
     * Only ADMIN role can access
     * 
     * @return Admin settings information
     */
    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> getSettings() {
        // TODO: Implement admin settings
        return new ResponseEntity<>("Admin Settings - Access Granted", HttpStatus.OK);
    }

    // ==================== VENDOR PROFILE (EXAMPLE) ====================

    /**
     * Endpoint for vendors - demonstrates role-based access
     * This is for reference - typically vendors use different portal
     */
    @GetMapping("/vendor/profile")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<String> getVendorProfile() {
        // TODO: Implement vendor profile
        return new ResponseEntity<>("Vendor Profile - Access Granted", HttpStatus.OK);
    }
}