package com.cibf.service.impl;

import com.cibf.dto.ReservationResponse;
import com.cibf.dto.UserDetailResponse;
import com.cibf.dto.UserResponse;
import com.cibf.entity.Employee;
import com.cibf.entity.User;
import com.cibf.entity.Role;
import com.cibf.exception.ResourceNotFoundException;
import com.cibf.repository.UserRepository;
import com.cibf.repository.EmployeeRepository;
import com.cibf.service.UserManagementService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RestTemplate restTemplate;

    @Value("${reservation.service.url:http://localhost:8083}")
    private String reservationServiceUrl;

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        log.info("Fetching all users with pagination: page={}, size={}",
                pageable.getPageNumber(), pageable.getPageSize());

        return userRepository.findAll(pageable)
                .map(this::mapToUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(String searchTerm, Pageable pageable) {
        log.info("Searching users with term: '{}', page={}, size={}",
                searchTerm, pageable.getPageNumber(), pageable.getPageSize());

        return userRepository.searchUsers(searchTerm, pageable)
                .map(this::mapToUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetailResponse getUserDetailById(Long userId) {
        log.info("Fetching user details for ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Fetch reservation history from Reservation Service
        List<ReservationResponse> reservations = fetchUserReservations(userId);

        return UserDetailResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .businessName(user.getBusinessName())
                .contactNumber(user.getContactNumber())
                .address(user.getAddress())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .reservations(reservations)
                .totalReservations(reservations.size())
                .activeReservations((int) reservations.stream()
                        .filter(r -> "CONFIRMED".equals(r.getStatus()))
                        .count())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public long getTotalUsersCount() {
        return userRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getUserStatistics() {
        log.info("Fetching user statistics");

        Map<String, Object> stats = new HashMap<>();

        // Total users
        stats.put("totalUsers", userRepository.count());

        // Recent users (last 10)
        Pageable recentLimit = PageRequest.of(0, 10);
        List<UserResponse> recentUsers = userRepository.findRecentUsers(recentLimit)
                .stream()
                .map(this::mapToUserResponse)
                .toList();
        stats.put("recentUsers", recentUsers);

        // User growth stats
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        LocalDateTime sevenDaysAgo = now.minusDays(7);
        LocalDateTime today = now.toLocalDate().atStartOfDay();

        stats.put("last30Days", userRepository.countUsersCreatedBetween(thirtyDaysAgo, now));
        stats.put("last7Days", userRepository.countUsersCreatedBetween(sevenDaysAgo, now));
        stats.put("today", userRepository.countUsersCreatedBetween(today, now));

        // Users by role
        stats.put("vendorCount", userRepository.countByRole("VENDOR"));
        stats.put("employeeCount", userRepository.countByRole("EMPLOYEE"));

        return stats;
    }

    /**
     * Fetch user's reservation history from Reservation Service
     */
    private List<ReservationResponse> fetchUserReservations(Long userId) {
        try {
            String url = reservationServiceUrl + "/api/reservations/user/" + userId;
            log.debug("Fetching reservations from: {}", url);

            ResponseEntity<List<ReservationResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ReservationResponse>>() {
                    });

            return response.getBody() != null ? response.getBody() : Collections.emptyList();

        } catch (Exception e) {
            log.error("Failed to fetch reservations for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Map User entity to UserResponse DTO
     */
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .businessName(user.getBusinessName())
                .contactNumber(user.getContactNumber())
                .address(user.getAddress())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Delete a user/vendor account
     * Checks if user has active reservations before deletion
     */
    @Override
    @Transactional
    public void deleteUser(Long userId) {
        log.info("Attempting to delete user with ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Prevent deletion of employee accounts through this endpoint
        if (user.isEmployee()) {
            log.warn("Attempted to delete employee {} through user deletion endpoint", user.getUsername());
            throw new IllegalStateException(
                    "Cannot delete employee accounts through this endpoint. Use deleteEmployee(id) instead.");
        }

        // Check if user has active reservations
        if (hasActiveReservations(userId)) {
            log.warn("Cannot delete user {} with active reservations", user.getUsername());
            throw new IllegalStateException(
                    "Cannot delete user with active reservations. Please cancel all reservations first.");
        }

        userRepository.delete(user);
        log.info("User deleted successfully: {} (ID: {})", user.getUsername(), userId);
    }

    /**
     * Delete an employee account
     * Deletes both Employee record and associated User record
     */
    @Override
    @Transactional
    public void deleteEmployee(Long userId) {
        log.info("Attempting to delete employee with user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Verify this is actually an employee
        if (!user.isEmployee()) {
            log.warn("Attempted to delete non-employee {} through employee deletion endpoint", user.getUsername());
            throw new IllegalStateException(
                    "User is not an employee. Use deleteUser(id) endpoint instead.");
        }

        // Prevent deletion of the last admin
        if (user.getRoleEnum() == Role.ADMIN) {
            long adminCount = userRepository.countByRole("ADMIN");
            if (adminCount <= 1) {
                log.warn("Attempted to delete the last admin account: {}", user.getUsername());
                throw new IllegalStateException(
                        "Cannot delete the last admin account. Please create another admin first.");
            }
        }

        // Find and delete the employee record first (cascade relationship)
        Optional<Employee> employeeOpt = employeeRepository.findByUser(user);
        if (employeeOpt.isPresent()) {
            employeeRepository.delete(employeeOpt.get());
            log.info("Employee record deleted for user: {}", user.getUsername());
        } else {
            log.warn("No employee record found for user: {}", user.getUsername());
        }

        // Delete the user record
        userRepository.delete(user);
        log.info("Employee user deleted successfully: {} (ID: {})", user.getUsername(), userId);
    }

    /**
     * Bulk delete users
     * Returns summary of successful and failed deletions
     */
    @Override
    @Transactional
    public Map<String, Object> bulkDeleteUsers(List<Long> userIds) {
        log.info("Bulk deleting {} users", userIds.size());

        List<Long> successfulDeletions = new ArrayList<>();
        List<Map<String, Object>> failedDeletions = new ArrayList<>();

        for (Long userId : userIds) {
            try {
                deleteUser(userId);
                successfulDeletions.add(userId);
                log.debug("Successfully deleted user ID: {}", userId);
            } catch (Exception e) {
                Map<String, Object> failure = new HashMap<>();
                failure.put("userId", userId);
                failure.put("reason", e.getMessage());
                failedDeletions.add(failure);
                log.warn("Failed to delete user {}: {}", userId, e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalRequested", userIds.size());
        result.put("successfulDeletions", successfulDeletions.size());
        result.put("failedDeletions", failedDeletions.size());
        result.put("successfulIds", successfulDeletions);
        result.put("failures", failedDeletions);
        result.put("timestamp", System.currentTimeMillis());

        log.info("Bulk delete completed: {} successful, {} failed",
                successfulDeletions.size(), failedDeletions.size());

        return result;
    }

    /**
     * Soft delete user (if you prefer to keep records)
     * This marks the user as inactive instead of deleting
     */
    @Override
    @Transactional
    public void softDeleteUser(Long userId) {
        log.info("Soft deleting user with ID: {}", userId);

        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // TODO: Implement soft delete if you add 'active' or 'deletedAt' fields to User
        // entity
        // Example implementation:
        // user.setActive(false);
        // user.setDeletedAt(LocalDateTime.now());
        // userRepository.save(user);

        log.warn("Soft delete not fully implemented. Add 'active' field to User entity.");
        throw new UnsupportedOperationException("Soft delete feature requires User entity modifications");
    }

    /**
     * Helper method to check if user has active reservations
     */
    private boolean hasActiveReservations(Long userId) {
        try {
            String url = reservationServiceUrl + "/api/reservations/user/" + userId;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> reservations = restTemplate.getForObject(url, List.class);

            if (reservations == null || reservations.isEmpty()) {
                return false;
            }

            // Check if any reservations are CONFIRMED or PENDING
            return reservations.stream()
                    .anyMatch(r -> {
                        String status = (String) r.get("status");
                        return "CONFIRMED".equals(status) || "PENDING".equals(status);
                    });

        } catch (Exception e) {
            log.warn("Could not check reservations for user {}: {}", userId, e.getMessage());
            // If we can't check, be safe and prevent deletion
            return true;
        }
    }
}