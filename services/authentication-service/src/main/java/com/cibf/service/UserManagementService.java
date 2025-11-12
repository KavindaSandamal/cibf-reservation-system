package com.cibf.service;

import com.cibf.dto.UserResponse;
import com.cibf.dto.UserDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

/**
 * Service interface for user management operations
 * Used by Employee Portal to view and manage users
 */
public interface UserManagementService {
    
    /**
     * Get all users with pagination
     * @param pageable Pagination parameters
     * @return Page of users
     */
    Page<UserResponse> getAllUsers(Pageable pageable);
    
    /**
     * Search users by business name or email
     * @param searchTerm Search query
     * @param pageable Pagination parameters
     * @return Page of matching users
     */
    Page<UserResponse> searchUsers(String searchTerm, Pageable pageable);
    
    /**
     * Get detailed user information by ID
     * Includes reservation history from Reservation Service
     * @param userId User ID
     * @return User details with reservations
     */
    UserDetailResponse getUserDetailById(Long userId);
    
    /**
     * Get total users count
     * @return Total number of registered users
     */
    long getTotalUsersCount();
    
    /**
     * Get user statistics for dashboard
     * @return Statistics map
     */
    Map<String, Object> getUserStatistics();
}