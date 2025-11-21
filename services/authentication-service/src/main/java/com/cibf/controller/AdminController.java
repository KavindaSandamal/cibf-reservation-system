package com.cibf.controller;

import com.cibf.dto.EmployeeRegistrationRequest;
import com.cibf.dto.UserRegistrationRequest;
import com.cibf.dto.UserResponse;
import com.cibf.dto.UserDetailResponse;
import com.cibf.service.IAuthService;
import com.cibf.service.UserManagementService;
import com.cibf.repository.UserRepository;
import com.cibf.entity.User;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;

/**
 * Admin/Employee Portal Controller
 * Provides endpoints for employee portal operations
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@Slf4j
public class AdminController {

    private final IAuthService authService;
    private final UserManagementService userManagementService;
    private final UserRepository userRepository;

    @Autowired
    public AdminController(IAuthService authService,
            UserManagementService userManagementService,
            UserRepository userRepository) {
        this.authService = authService;
        this.userManagementService = userManagementService;
        this.userRepository = userRepository;
    }

    // ==================== DASHBOARD ====================

    /**
     * Employee Dashboard - Main landing page
     * GET /api/admin/dashboard
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        log.info("Admin accessing dashboard");

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Employee Dashboard - Access Granted");
        response.put("timestamp", System.currentTimeMillis());

        // Get statistics
        Map<String, Object> stats = userManagementService.getUserStatistics();
        response.put("statistics", stats);
        response.put("totalUsers", userManagementService.getTotalUsersCount());

        return ResponseEntity.ok(response);
    }

    // ==================== USER MANAGEMENT ====================

    /**
     * Get all users with pagination and search
     * GET
     * /api/admin/users?search={query}&page={page}&size={size}&sortBy={field}&sortDir={ASC|DESC}
     */
    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("Admin fetching users - search: {}, page: {}, size: {}", search, page, size);

        Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
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
        response.put("pageSize", users.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * Get specific user details with reservation history
     * GET /api/admin/users/{id}
     */
    @GetMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<UserDetailResponse> getUserById(@PathVariable Long id) {
        log.info("Admin fetching user details for ID: {}", id);
        UserDetailResponse userDetail = userManagementService.getUserDetailById(id);
        return ResponseEntity.ok(userDetail);
    }

    /**
     * Get user statistics for dashboard
     * GET /api/admin/users/statistics
     */
    @GetMapping("/users/statistics")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStatistics() {
        log.info("Admin fetching user statistics");
        Map<String, Object> stats = userManagementService.getUserStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Export users to CSV
     * GET /api/admin/users/export
     */
    @GetMapping("/users/export")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<byte[]> exportUsers() {
        log.info("Admin exporting users to CSV");

        List<User> users = userRepository.findAll();
        StringBuilder csv = new StringBuilder();

        // CSV Header
        csv.append("ID,Email,Business Name,Contact Number,Address,Role,Created At\n");

        // CSV Data
        for (User user : users) {
            csv.append(String.format("%d,\"%s\",\"%s\",\"%s\",\"%s\",%s,%s\n",
                    user.getId(),
                    user.getEmail() != null ? user.getEmail() : "",
                    user.getBusinessName() != null ? user.getBusinessName() : "",
                    user.getContactNumber() != null ? user.getContactNumber() : "",
                    user.getAddress() != null ? user.getAddress() : "",
                    user.getRole(),
                    user.getCreatedAt()));
        }

        byte[] csvBytes = csv.toString().getBytes(StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "users.csv");
        headers.setContentLength(csvBytes.length);

        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }

    // ==================== EMPLOYEE MANAGEMENT (ADMIN ONLY) ====================

    /**
     * Create new employee account (Admin only)
     * POST /api/admin/employees
     */
    @PostMapping("/employees")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createEmployee(@Valid @RequestBody EmployeeRegistrationRequest registrationRequest) {
        log.info("Admin creating new employee: {}", registrationRequest.getUsername());
        return authService.createEmployeeByAdmin(registrationRequest);
    }

    /**
     * Create new user/vendor account (Admin only)
     * POST /api/admin/users
     */
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserRegistrationRequest registrationRequest) {
        log.info("Admin creating new user: {}", registrationRequest.getUsername());
        return authService.createUserByAdmin(registrationRequest);
    }

    // ==================== SETTINGS (ADMIN ONLY) ====================

    /**
     * Admin settings page
     * GET /api/admin/settings
     */
    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> getSettings() {
        return new ResponseEntity<>("Admin Settings - Access Granted", HttpStatus.OK);
    }
}