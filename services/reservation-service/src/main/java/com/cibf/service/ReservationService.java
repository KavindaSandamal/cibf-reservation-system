package com.cibf.service;

import com.cibf.dto.*;
import com.cibf.entity.Reservation;
import com.cibf.entity.ReservationStatus;
import com.cibf.repository.ReservationRepository;
import com.cibf.client.UserServiceClient;
import com.cibf.client.StallServiceClient;
import com.cibf.exception.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationService {

    private static final int MAX_STALLS_PER_USER = 3;
    private static final int HOLD_DURATION_MINUTES = 5;

    private final ReservationRepository reservationRepository;
    private final LockService lockService;
    private final EventPublisherService eventPublisher;
    private final UserServiceClient userServiceClient;
    private final StallServiceClient stallServiceClient;

    /**
     * Hold stalls temporarily (5 minutes)
     */
    @Transactional
    public HoldStallResponse holdStalls(HoldStallRequest request) {
        Long userId = request.getUserId();
        List<Long> stallIds = request.getStallIds();

        log.info("Processing hold request for user: {} and stalls: {}", userId, stallIds);

        // Validate number of stalls
        if (stallIds.isEmpty() || stallIds.size() > MAX_STALLS_PER_USER) {
            throw new BadRequestException(
                    String.format("You can hold between 1 and %d stalls", MAX_STALLS_PER_USER)
            );
        }

        // Check if user exists
        if (!userServiceClient.userExists(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }

        // Check user's current reservation count
        long currentCount = reservationRepository.countActiveReservationsByUserId(userId);
        if (currentCount + stallIds.size() > MAX_STALLS_PER_USER) {
            throw new BadRequestException(
                    String.format("You can only reserve up to %d stalls. You currently have %d active reservations.",
                            MAX_STALLS_PER_USER, currentCount)
            );
        }

        // Acquire locks for all stalls
        List<Long> locksAcquired = new ArrayList<>();
        try {
            for (Long stallId : stallIds) {
                // Check if stall is available
                if (!stallServiceClient.isStallAvailable(stallId)) {
                    throw new ConflictException("Stall " + stallId + " is not available");
                }

                // Try to acquire lock
                boolean lockAcquired = lockService.acquireLock(
                        stallId.toString(),
                        userId.toString(),
                        HOLD_DURATION_MINUTES
                );

                if (!lockAcquired) {
                    throw new ConflictException(
                            "Stall " + stallId + " is currently being reserved by another user"
                    );
                }

                locksAcquired.add(stallId);
            }

            // Generate hold token and expiry time
            String holdToken = java.util.UUID.randomUUID().toString();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(HOLD_DURATION_MINUTES);

            // Create pending reservations
            for (Long stallId : stallIds) {
                Reservation reservation = Reservation.builder()
                        .userId(userId)
                        .stallId(stallId)
                        .status(ReservationStatus.PENDING)
                        .holdToken(holdToken)
                        .holdExpiresAt(expiresAt)
                        .build();

                reservationRepository.save(reservation);
            }

            log.info("Stalls held successfully for user {}: {}", userId, stallIds);

            // Publish event
            eventPublisher.publishReservationHeld(userId, stallIds, holdToken, expiresAt);

            return new HoldStallResponse(holdToken, expiresAt);

        } catch (Exception e) {
            // Release any acquired locks on error
            for (Long stallId : locksAcquired) {
                lockService.releaseLock(stallId.toString());
            }
            throw e;
        }
    }

    /**
     * Confirm reservation with hold token
     */
    @Transactional
    public List<ReservationResponse> confirmReservation(ConfirmReservationRequest request) {
        String holdToken = request.getHoldToken();
        Long userId = request.getUserId();

        log.info("Confirming reservation for user {} with hold token: {}", userId, holdToken);

        // Find reservations with hold token
        List<Reservation> reservations = reservationRepository
                .findByUserIdAndStatus(userId, ReservationStatus.PENDING)
                .stream()
                .filter(r -> holdToken.equals(r.getHoldToken()))
                .collect(Collectors.toList());

        if (reservations.isEmpty()) {
            throw new ResourceNotFoundException("Invalid or expired hold token");
        }

        // Check if hold has expired
        Reservation firstReservation = reservations.get(0);
        if (LocalDateTime.now().isAfter(firstReservation.getHoldExpiresAt())) {
            throw new BadRequestException("Hold has expired. Please select stalls again.");
        }

        List<Reservation> confirmedReservations = new ArrayList<>();

        try {
            // Confirm all reservations
            for (Reservation reservation : reservations) {
                // Update stall status to reserved
                stallServiceClient.updateStallStatus(reservation.getStallId(), "RESERVED");

                // Update reservation status
                reservation.setStatus(ReservationStatus.CONFIRMED);
                reservation.setConfirmedAt(LocalDateTime.now());
                reservation.setHoldToken(null);
                reservation.setHoldExpiresAt(null);

                Reservation confirmed = reservationRepository.save(reservation);
                confirmedReservations.add(confirmed);

                // Release lock
                lockService.releaseLock(reservation.getStallId().toString());
            }

            log.info("Reservations confirmed for user {}: {} stalls", userId, confirmedReservations.size());

            // Publish event for notification service
            eventPublisher.publishReservationConfirmed(userId, confirmedReservations);

            return confirmedReservations.stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to confirm reservations: {}", e.getMessage());
            throw new BadRequestException("Failed to confirm reservation. Please try again.");
        }
    }

    /**
     * Get reservation by ID
     */
    public ReservationResponse getReservationById(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));
        return mapToResponse(reservation);
    }

    /**
     * Get all reservations for a user
     */
    public List<ReservationResponse> getReservationsByUserId(Long userId) {
        List<Reservation> reservations = reservationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return reservations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update reservation
     */
    @Transactional
    public ReservationResponse updateReservation(Long id, UpdateReservationRequest request) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        if (request.getNotes() != null) {
            reservation.setNotes(request.getNotes());
        }

        if (request.getStatus() != null) {
            reservation.setStatus(ReservationStatus.valueOf(request.getStatus().toUpperCase()));
        }

        Reservation updated = reservationRepository.save(reservation);
        return mapToResponse(updated);
    }

    /**
     * Cancel reservation
     */
    @Transactional
    public void cancelReservation(Long id, Long userId) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BadRequestException("Reservation is already cancelled");
        }

        // Update stall status back to available
        stallServiceClient.updateStallStatus(reservation.getStallId(), "AVAILABLE");

        // Cancel reservation
        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        reservation.setCancelledBy(userId);

        reservationRepository.save(reservation);

        // Publish event
        eventPublisher.publishReservationCancelled(id, reservation.getUserId(), reservation.getStallId());

        log.info("Reservation {} cancelled by user {}", id, userId);
    }

    /**
     * Clean up expired holds (scheduled job)
     */
    @Transactional
    public void cleanupExpiredHolds() {
        List<Reservation> expiredReservations = reservationRepository
                .findExpiredHolds(LocalDateTime.now());

        for (Reservation reservation : expiredReservations) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);

            lockService.releaseLock(reservation.getStallId().toString());

            log.info("Expired hold cleaned up: {}", reservation.getId());
        }
    }

    /**
     * Map entity to response DTO
     */
    private ReservationResponse mapToResponse(Reservation reservation) {
        return ReservationResponse.builder()
                .id(reservation.getId())
                .userId(reservation.getUserId())
                .stallId(reservation.getStallId())
                .status(reservation.getStatus().name())
                .notes(reservation.getNotes())
                .createdAt(reservation.getCreatedAt())
                .confirmedAt(reservation.getConfirmedAt())
                .qrCodeUrl(reservation.getQrCodeUrl())
                .build();
    }
}
