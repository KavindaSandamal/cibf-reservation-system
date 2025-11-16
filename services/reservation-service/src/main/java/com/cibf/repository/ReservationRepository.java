package com.cibf.repository;

import com.cibf.entity.Reservation;
import com.cibf.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // Find reservation by ID
    Optional<Reservation> findById(Long id);

    // Find all reservations by user ID
    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Find reservation by stall ID and status
    Optional<Reservation> findByStallIdAndStatus(Long stallId, ReservationStatus status);

    // Find by hold token
    Optional<Reservation> findByHoldToken(String holdToken);

    // Count active reservations by user (CONFIRMED or PENDING)
    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.userId = :userId " +
           "AND r.status IN ('CONFIRMED', 'PENDING')")
    long countActiveReservationsByUserId(@Param("userId") Long userId);

    // Find expired holds
    @Query("SELECT r FROM Reservation r WHERE r.status = 'PENDING' " +
           "AND r.holdExpiresAt < :currentTime")
    List<Reservation> findExpiredHolds(@Param("currentTime") LocalDateTime currentTime);

    // Find all by user ID and status
    List<Reservation> findByUserIdAndStatus(Long userId, ReservationStatus status);

    // Find all by status
    List<Reservation> findByStatus(ReservationStatus status);

    // Check if stall is reserved
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Reservation r " +
           "WHERE r.stallId = :stallId AND r.status = 'CONFIRMED'")
    boolean isStallReserved(@Param("stallId") Long stallId);
}
