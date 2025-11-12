package com.cibf.service.impl;

import com.cibf.dto.UserResponse;
import com.cibf.dto.UserDetailResponse;
import com.cibf.dto.ReservationResponse;
import com.cibf.entity.User;
import com.cibf.exception.ResourceNotFoundException;
import com.cibf.repository.UserRepository;
import com.cibf.service.UserManagementService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementation of UserManagementService
 * Handles user management operations for Employee Portal
 */
@Service
@Slf4j
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${reservation.service.url:http://localhost:8083}")
    private String reservationServiceUrl;

    @Autowired
    public UserManagementServiceImpl(UserRepository userRepository, RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
    }

    @Override
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        log.info("Fetching all users with pagination: page={}, size={}", 
                 pageable.getPageNumber(), pageable.getPageSize());
        
        Page<User> users = userRepository.findAll(pageable);
        return users.map(this::convertToUserResponse);
    }

    @Override
    public Page<UserResponse> searchUsers(String searchTerm, Pageable pageable) {
        log.info("Searching users with term: {}", searchTerm);
        
        Page<User> users = userRepository.searchUsers(searchTerm, pageable);
        return users.map(this::convertToUserResponse);
    }

    @Override
    public UserDetailResponse getUserDetailById(Long userId) {
        log.info("Fetching detailed information for user ID: {}", userId);
        
        // Get user from database
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        
        // Convert to detail response
        UserDetailResponse response = convertToUserDetailResponse(user);
        
        // Fetch user's reservation history from Reservation Service
        try {
            String url = reservationServiceUrl + "/api/admin/reservations/user/" + userId;
            log.info("Calling Reservation Service: {}", url);
            
            ResponseEntity<List<ReservationResponse>> reservationsResponse = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<ReservationResponse>>() {}
            );
            
            List<ReservationResponse> reservations = reservationsResponse.getBody();
            response.setReservations(reservations);
            log.info("Retrieved {} reservations for user {}", 
                     reservations != null ? reservations.size() : 0, userId);
            
        } catch (Exception e) {
            log.error("Failed to fetch reservations from Reservation Service for user {}", userId, e);
            // Continue without reservations rather than failing
            response.setReservations(List.of());
        }
        
        return response;
    }

    @Override
    public long getTotalUsersCount() {
        return userRepository.count();
    }

    @Override
    public Map<String, Object> getUserStatistics() {
        log.info("Calculating user statistics");
        
        Map<String, Object> stats = new HashMap<>();
        
        // Total users
        long totalUsers = userRepository.count();
        stats.put("totalUsers", totalUsers);
        
        // Recent registrations (last 7 days)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minus(7, ChronoUnit.DAYS);
        long recentRegistrations = userRepository.countByCreatedAtAfter(sevenDaysAgo);
        stats.put("recentRegistrations", recentRegistrations);
        
        // Today's registrations
        LocalDateTime startOfDay = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS);
        long todayRegistrations = userRepository.countByCreatedAtAfter(startOfDay);
        stats.put("todayRegistrations", todayRegistrations);
        
        log.info("User statistics: total={}, recent={}, today={}", 
                 totalUsers, recentRegistrations, todayRegistrations);
        
        return stats;
    }

    // ==================== HELPER METHODS ====================

    /**
     * Convert User entity to UserResponse DTO
     */
    private UserResponse convertToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .businessName(user.getBusinessName())
                .contactNumber(user.getContactNumber())
                .address(user.getAddress())
                .role(user.getRole())  // 🔧 FIXED: Already a String, no need for .name()
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Convert User entity to UserDetailResponse DTO
     */
    private UserDetailResponse convertToUserDetailResponse(User user) {
        return UserDetailResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .businessName(user.getBusinessName())
                .contactNumber(user.getContactNumber())
                .address(user.getAddress())
                .role(user.getRole())  // 🔧 FIXED: Already a String
                .createdAt(user.getCreatedAt())
                .build();
    }
}