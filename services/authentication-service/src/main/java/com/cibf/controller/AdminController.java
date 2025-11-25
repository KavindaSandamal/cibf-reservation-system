package com.cibf.controller;

import com.cibf.dto.EmployeeRegistrationRequest;
import com.cibf.dto.AdminRegistrationRequest;
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
import java.util.Arrays;

/**
 * Admin/Employee Portal Controller
 * Provides endpoints for employee portal operations
 */
@RestController
@RequestMapping("/api/admin")
@Slf4j
public class AdminController {

    private final IAuthService authService;
    private final UserManagementService userManagementService;
    private final UserRepository userRepository;

    // Valid sortable fields
    private static final List<String> VALID_SORT_FIELDS = Arrays.asList(
            "id", "email", "businessName", "contactNumber", "role", "createdAt", "updatedAt");

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
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("Admin fetching users - search: {}, page: {}, size: {}", search, page, size);

        // Validate page number
        if (page < 0) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid page number");
            errorResponse.put("message", "Page number must be greater than or equal to 0");
            errorResponse.put("field", "page");
            errorResponse.put("value", String.valueOf(page));
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Validate page size
        if (size <= 0 || size > 100) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid page size");
            errorResponse.put("message", "Page size must be between 1 and 100");
            errorResponse.put("field", "size");
            errorResponse.put("value", String.valueOf(size));
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Validate sort field
        if (!VALID_SORT_FIELDS.contains(sortBy)) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid sort field");
            errorResponse.put("message", "Valid sort fields: " + String.join(", ", VALID_SORT_FIELDS));
            errorResponse.put("field", "sortBy");
            errorResponse.put("value", sortBy);
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Validate sort direction
        if (!sortDir.equalsIgnoreCase("ASC") && !sortDir.equalsIgnoreCase("DESC")) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid sort direction");
            errorResponse.put("message", "Sort direction must be ASC or DESC");
            errorResponse.put("field", "sortDir");
            errorResponse.put("value", sortDir);
            return ResponseEntity.badRequest().body(errorResponse);
        }

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
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        log.info("Admin fetching user details for ID: {}", id);

        try {
            UserDetailResponse userDetail = userManagementService.getUserDetailById(id);
            return ResponseEntity.ok(userDetail);
        } catch (Exception e) {
            log.error("Error fetching user {}: {}", id, e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "User not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("userId", id.toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
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
        ResponseEntity<?> authResponse = authService.createEmployeeByAdmin(registrationRequest);

        // Extract userId from response if successful and add it to response body
        if (authResponse.getStatusCode() == HttpStatus.CREATED && authResponse.hasBody()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = (Map<String, Object>) authResponse.getBody();
                if (body != null && !body.containsKey("userId")) {
                    log.info("Employee created successfully");
                }
            } catch (Exception e) {
                log.warn("Could not extract userId from response: {}", e.getMessage());
            }
        }

        return authResponse;
    }

    /**
     * Create new admin account (Admin only)
     * POST /api/admin/admins
     */
    @PostMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAdmin(@Valid @RequestBody AdminRegistrationRequest registrationRequest) {
        log.info("Admin creating new admin account: {}", registrationRequest.getUsername());

        ResponseEntity<?> authResponse = authService.createAdminByAdmin(registrationRequest);

        if (authResponse.getStatusCode() == HttpStatus.CREATED && authResponse.hasBody()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = (Map<String, Object>) authResponse.getBody();
                if (body != null && !body.containsKey("userId")) {
                    log.info("Admin account created successfully");
                }
            } catch (Exception e) {
                log.warn("Could not extract userId from response: {}", e.getMessage());
            }
        }

        return authResponse;
    }

    /**
     * Create new user/vendor account (Admin only)
     * POST /api/admin/users
     */
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserRegistrationRequest registrationRequest) {
        log.info("Admin creating new user: {}", registrationRequest.getUsername());
        ResponseEntity<?> authResponse = authService.createUserByAdmin(registrationRequest);

        // Extract userId from response if successful
        if (authResponse.getStatusCode() == HttpStatus.CREATED && authResponse.hasBody()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = (Map<String, Object>) authResponse.getBody();
                if (body != null && !body.containsKey("userId")) {
                    log.info("User created successfully");
                }
            } catch (Exception e) {
                log.warn("Could not extract userId from response: {}", e.getMessage());
            }
        }

        return authResponse;
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

    // ==================== DELETE OPERATIONS ====================

    /**
     * Delete a user/vendor account (Admin only)
     * DELETE /api/admin/users/{id}
     */
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        log.info("Admin attempting to delete user with ID: {}", id);

        try {
            userManagementService.deleteUser(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "User deleted successfully");
            response.put("userId", id.toString());
            response.put("timestamp", String.valueOf(System.currentTimeMillis()));

            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            log.warn("Cannot delete user {}: {}", id, e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Cannot delete user");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("userId", id.toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Failed to delete user {}: {}", id, e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "User not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("userId", id.toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    /**
     * Delete an employee account (Admin only)
     * DELETE /api/admin/employees/{id}
     */
    @DeleteMapping("/employees/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteEmployee(@PathVariable Long id) {
        log.info("Admin attempting to delete employee with ID: {}", id);

        try {
            userManagementService.deleteEmployee(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Employee deleted successfully");
            response.put("employeeId", id.toString());
            response.put("timestamp", String.valueOf(System.currentTimeMillis()));

            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            log.warn("Cannot delete employee {}: {}", id, e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Cannot delete employee");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("employeeId", id.toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Failed to delete employee {}: {}", id, e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Employee not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("employeeId", id.toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    /**
     * Bulk delete users (Admin only)
     * DELETE /api/admin/users/bulk
     * Body: { "userIds": [1, 2, 3] }
     */
    @DeleteMapping("/users/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> bulkDeleteUsers(@RequestBody Map<String, List<Long>> request) {
        List<Long> userIds = request.get("userIds");

        if (userIds == null || userIds.isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid request");
            errorResponse.put("message", "userIds list cannot be empty");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        log.info("Admin attempting to bulk delete {} users", userIds.size());

        Map<String, Object> result = userManagementService.bulkDeleteUsers(userIds);
        return ResponseEntity.ok(result);
    }
}