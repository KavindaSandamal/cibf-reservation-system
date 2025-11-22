// ============================================
// ReservationRepository.java - UPDATED
// ============================================
// FILE: services/reservation-service/src/main/java/com/cibf/repository/ReservationRepository.java

package com.cibf.repository;

import com.cibf.entity.Reservation;
import com.cibf.entity.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

       /**
        * ✅ CHANGED: Returns List<Reservation> instead of Optional<Reservation>
        * This is because one hold token can have multiple reservations (one per stall)
        */
       List<Reservation> findByUserIdAndHoldToken(Long userId, String holdToken);

       /**
        * Find all reservations by user ID ordered by creation date
        */
       List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);

       /**
        * Count active reservations by user ID
        */
       @Query("SELECT COUNT(r) FROM Reservation r WHERE r.userId = :userId AND r.status IN ('PENDING', 'CONFIRMED')")
       long countActiveReservationsByUserId(@Param("userId") Long userId);

       /**
        * Find expired holds (PENDING status with expired holdExpiresAt)
        */
       @Query("SELECT r FROM Reservation r WHERE r.status = 'PENDING' AND r.holdExpiresAt < :now")
       List<Reservation> findExpiredHolds(@Param("now") LocalDateTime now);

       /**
        * Find reservations by status
        */
       List<Reservation> findByStatus(ReservationStatus status);

       /**
        * Find reservations by user ID and status
        */
       List<Reservation> findByUserIdAndStatus(Long userId, ReservationStatus status);

       /**
        * Find reservation by stall ID
        */
       Optional<Reservation> findByStallIdAndStatus(Long stallId, ReservationStatus status);

       /**
        * Check if stall is reserved
        */
       @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Reservation r " +
                     "WHERE r.stallId = :stallId AND r.status IN ('PENDING', 'CONFIRMED')")
       boolean existsByStallIdAndActiveStatus(@Param("stallId") Long stallId);

       /**
        * Find all confirmed reservations
        */
       @Query("SELECT r FROM Reservation r WHERE r.status = 'CONFIRMED' ORDER BY r.confirmedAt DESC")
       List<Reservation> findAllConfirmedReservations();

       /**
        * Find reservations by date range
        */
       @Query("SELECT r FROM Reservation r WHERE r.createdAt BETWEEN :startDate AND :endDate")
       List<Reservation> findByDateRange(
                     @Param("startDate") LocalDateTime startDate,
                     @Param("endDate") LocalDateTime endDate);

       /**
        * Find reservations with QR codes
        */
       @Query("SELECT r FROM Reservation r WHERE r.qrCodeUrl IS NOT NULL")
       List<Reservation> findAllWithQRCode();

       /**
        * Count reservations by status
        */
       long countByStatus(ReservationStatus status);

       /**
        * Find recent reservations (last N days)
        */
       @Query("SELECT r FROM Reservation r WHERE r.createdAt >= :since ORDER BY r.createdAt DESC")
       List<Reservation> findRecentReservations(@Param("since") LocalDateTime since);

       /**
        * Find all reservations with filters (for admin/employee portal)
        * Supports filtering by status, date range, and search (by ID, user email, or business name)
        */
       @Query("SELECT DISTINCT r FROM Reservation r WHERE " +
              "(:status IS NULL OR r.status = :status) AND " +
              "(:startDate IS NULL OR r.createdAt >= :startDate) AND " +
              "(:endDate IS NULL OR r.createdAt <= :endDate) AND " +
              "(:search IS NULL OR CAST(r.id AS string) LIKE %:search% OR " +
              "LOWER(r.userEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
              "LOWER(r.businessName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
              "ORDER BY r.createdAt DESC")
       Page<Reservation> findAllWithFilters(
              @Param("status") ReservationStatus status,
              @Param("startDate") LocalDateTime startDate,
              @Param("endDate") LocalDateTime endDate,
              @Param("search") String search,
              Pageable pageable);
}