package com.cibf.repository;

import com.cibf.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for User entity
 * Provides database access methods for both authentication and admin operations
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ==================== AUTHENTICATION METHODS ====================

    /**
     * Find user by username (used in authentication)
     */
    Optional<User> findByUsername(String username);

    /**
     * Find user by email
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if username exists (for registration validation)
     */
    boolean existsByUsername(String username);

    /**
     * Check if email exists
     */
    boolean existsByEmail(String email);

    // ==================== EMPLOYEE PORTAL METHODS ====================

    /**
     * Search users by business name, email, or username
     * Used in Employee Portal for user search functionality
     * Supports partial matching (LIKE query)
     */
    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.businessName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<User> searchUsers(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Get recent users ordered by creation date (most recent first)
     * Used for "Recent Users" dashboard widget
     */
    @Query("SELECT u FROM User u ORDER BY u.createdAt DESC")
    List<User> findRecentUsers(Pageable pageable);

    /**
     * Count users created between two dates
     * Used for user growth statistics (daily, weekly, monthly)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN :start AND :end")
    Long countUsersCreatedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Count users created after a specific date
     * Alternative method for tracking new registrations
     */
    long countByCreatedAtAfter(LocalDateTime date);

    /**
     * Get users by role (VENDOR, EMPLOYEE, ADMIN)
     * Used to filter users by their role
     */
    @Query("SELECT u FROM User u WHERE u.role = :role")
    List<User> findByRole(@Param("role") String role);

    /**
     * Count users by role
     * Used for role distribution statistics in dashboard
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    Long countByRole(@Param("role") String role);

    /**
     * Get all vendors with pagination
     * Filters only users with VENDOR role
     */
    @Query("SELECT u FROM User u WHERE u.role = 'VENDOR' ORDER BY u.createdAt DESC")
    Page<User> findAllVendors(Pageable pageable);

    /**
     * Get all employees with pagination
     * Filters users with EMPLOYEE or ADMIN roles
     */
    @Query("SELECT u FROM User u WHERE u.role IN ('EMPLOYEE', 'ADMIN') ORDER BY u.createdAt DESC")
    Page<User> findAllEmployees(Pageable pageable);

    /**
     * Count total vendors
     * Quick count of all vendor users
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'VENDOR'")
    Long countVendors();

    /**
     * Count total employees (including admins)
     * Quick count of all employee/admin users
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role IN ('EMPLOYEE', 'ADMIN')")
    Long countEmployees();

    // For search functionality
    Page<User> findByUsernameContainingIgnoreCaseOrBusinessNameContainingIgnoreCase(
            String username, String businessName, Pageable pageable);
}