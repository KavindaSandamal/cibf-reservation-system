package com.cibf.repository;

import com.cibf.entity.Reservation;
import com.cibf.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long>, JpaSpecificationExecutor<Reservation> {

       /**
        * Find all reservations by user ID and hold token
        */
       List<Reservation> findByUserIdAndHoldToken(Long userId, String holdToken);

       /**
        * Find all reservations by user ID ordered by creation date
        */
       List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);

       /**
        * Find all reservations by user ID
        */
       List<Reservation> findByUserId(Long userId);

       /**
        * Count active reservations by user ID
        */
       @Query("SELECT COUNT(r) FROM Reservation r WHERE r.userId = :userId AND r.status IN ('PENDING', 'CONFIRMED')")
       long countActiveReservationsByUserId(@Param("userId") Long userId);

       /**
        * Find expired holds
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
        * Find reservation by stall ID and status
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
        * Find recent reservations
        */
       @Query("SELECT r FROM Reservation r WHERE r.createdAt >= :since ORDER BY r.createdAt DESC")
       List<Reservation> findRecentReservations(@Param("since") LocalDateTime since);

       /**
        * Find top 10 recent reservations
        */
       List<Reservation> findTop10ByOrderByCreatedAtDesc();

       /**
        * Find reservations by status and date range
        */
       List<Reservation> findByStatusAndCreatedAtBetween(
                     ReservationStatus status,
                     LocalDateTime startDate,
                     LocalDateTime endDate);

       /**
        * Find reservations by date range
        */
       List<Reservation> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

       /**
        * Count reservations by date range
        */
       long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

       /**
        * Find reservations by user email
        */
       List<Reservation> findByUserEmailContainingIgnoreCase(String email);

       /**
        * Find reservations by business name
        */
       List<Reservation> findByBusinessNameContainingIgnoreCase(String businessName);
}