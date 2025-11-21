package com.cibf.service.impl;

import com.cibf.dto.ReservationResponse;
import com.cibf.dto.UserDetailResponse;
import com.cibf.dto.UserResponse;
import com.cibf.entity.User;
import com.cibf.repository.UserRepository;
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
}