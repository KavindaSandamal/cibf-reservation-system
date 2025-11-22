package com.cibf.service;

import com.cibf.dto.*;
import com.cibf.entity.Reservation;
import com.cibf.entity.ReservationStatus;
import com.cibf.exception.BadRequestException;
import com.cibf.exception.ConflictException;
import com.cibf.exception.ResourceNotFoundException;
import com.cibf.repository.ReservationRepository;
import com.cibf.client.StallServiceClient;
import com.cibf.client.UserServiceClient;
import com.cibf.entity.Stall.StallStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
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
    private final QRCodeService qrCodeService;
    private final EmailService emailService;

    public HoldStallResponse holdStalls(HoldStallRequest request) {
        Long userId = request.getUserId();
        List<Long> stallIds = request.getStallIds();

        log.info("Processing hold request for user {}: {}", userId, stallIds);

        if (stallIds.isEmpty() || stallIds.size() > MAX_STALLS_PER_USER) {
            throw new BadRequestException("You can hold between 1 and " + MAX_STALLS_PER_USER + " stalls");
        }

        if (!userServiceClient.userExists(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }

        long currentCount = reservationRepository.countActiveReservationsByUserId(userId);
        if (currentCount + stallIds.size() > MAX_STALLS_PER_USER) {
            throw new BadRequestException(String.format(
                    "You can only reserve up to %d stalls. You currently have %d active reservations.",
                    MAX_STALLS_PER_USER, currentCount));
        }

        List<Long> acquiredLocks = stallIds.stream()
                .filter(stallId -> lockService.acquireLock(
                        stallId.toString(),
                        userId.toString(),
                        HOLD_DURATION_MINUTES))
                .toList();

        if (acquiredLocks.size() != stallIds.size()) {
            acquiredLocks.forEach(id -> lockService.releaseLock(id.toString()));
            throw new ConflictException("One or more stalls are currently being reserved by another user");
        }

        String holdToken = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(HOLD_DURATION_MINUTES);

        stallIds.forEach(stallId -> {
            Reservation reservation = Reservation.builder()
                    .userId(userId)
                    .stallId(stallId)
                    .status(ReservationStatus.PENDING)
                    .holdToken(holdToken)
                    .holdExpiresAt(expiresAt)
                    .businessName(request.getBusinessName())
                    .build();
            reservationRepository.save(reservation);
        });

        eventPublisher.publishReservationHeld(userId, stallIds, holdToken, expiresAt);
        log.info("✅ Stalls held successfully for user {}: {}", userId, stallIds);

        return new HoldStallResponse(holdToken, expiresAt);
    }

    public ReservationResponse confirmReservation(ConfirmReservationRequest request) {
        log.info("Confirming reservation for user: {}, holdToken: {}", request.getUserId(), request.getHoldToken());

        List<Reservation> reservations = reservationRepository
                .findByUserIdAndHoldToken(request.getUserId(), request.getHoldToken());

        if (reservations.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No reservation found for user: " + request.getUserId() + " with hold token: "
                            + request.getHoldToken());
        }

        for (Reservation reservation : reservations) {
            if (reservation.getStatus() != ReservationStatus.PENDING) {
                throw new BadRequestException(
                        "Reservation cannot be confirmed. Current status: " + reservation.getStatus());
            }

            if (reservation.getHoldExpiresAt() != null &&
                    reservation.getHoldExpiresAt().isBefore(LocalDateTime.now())) {
                throw new BadRequestException("Hold token has expired. Please select stalls again.");
            }
        }

        if (request.getBusinessName() != null) {
            reservations.forEach(r -> r.setBusinessName(request.getBusinessName()));
        }
        if (request.getUserEmail() != null) {
            reservations.forEach(r -> r.setUserEmail(request.getUserEmail()));
        }

        LocalDateTime confirmedAt = LocalDateTime.now();
        reservations.forEach(reservation -> {
            reservation.setStatus(ReservationStatus.CONFIRMED);
            reservation.setConfirmedAt(confirmedAt);
            reservationRepository.save(reservation);

            // **UPDATE STALL STATUS TO RESERVED**
            try {
                log.info("🔄 Updating stall {} status to RESERVED", reservation.getStallId());
                stallServiceClient.updateStallStatus(reservation.getStallId(), StallStatus.RESERVED);
                log.info("✅ Stall {} status updated successfully", reservation.getStallId());
            } catch (Exception e) {
                log.error("❌ Failed to update stall status for stall: {}", reservation.getStallId(), e);
            }

        });

        Reservation mainReservation = reservations.get(0);

        List<Long> stallIds = reservations.stream()
                .map(Reservation::getStallId)
                .collect(Collectors.toList());

        List<ReservationConfirmationDto.StallInfo> stallInfos = getStallsInfoByIds(stallIds);

        BigDecimal totalAmount = stallInfos.stream()
                .map(ReservationConfirmationDto.StallInfo::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        reservations.forEach(r -> r.setTotalAmount(totalAmount));

        // 🎯 PUBLISH EVENT TO RABBITMQ (instead of direct processing)
        try {
            log.info("📤 Publishing reservation confirmed event to RabbitMQ");

            eventPublisher.publishReservationConfirmed(
                    mainReservation.getId(),
                    mainReservation.getUserId(),
                    request.getUserEmail() != null ? request.getUserEmail() : mainReservation.getUserEmail(),
                    stallIds);

            log.info("✅ Reservation event published to RabbitMQ - async processing started");

        } catch (Exception e) {
            log.error("⚠️ Failed to publish event to RabbitMQ, falling back to direct processing", e);

            // FALLBACK: Direct processing if RabbitMQ fails
            processReservationDirectly(mainReservation, request, stallInfos, totalAmount);
        }

        // Return response immediately (email and QR will be processed async)
        ReservationResponse response = mapToResponse(mainReservation);
        response.setStalls(stallInfos.stream()
                .map(s -> ReservationResponse.StallSummary.builder()
                        .id(s.getId())
                        .stallName(s.getStallName())
                        .size(s.getSize())
                        .dimension(s.getDimension())
                        .price(s.getPrice())
                        .build())
                .collect(Collectors.toList()));
        response.setTotalAmount(totalAmount);
        response.setQrCodeUrl("Processing..."); // Will be updated async

        log.info("✅ Reservation confirmed successfully: ID={}", mainReservation.getId());
        log.info("📧 Email and QR code will be processed asynchronously");

        return response;
    }

    /**
     * Fallback method for direct processing if RabbitMQ fails
     */
    private void processReservationDirectly(Reservation reservation,
            ConfirmReservationRequest request,
            List<ReservationConfirmationDto.StallInfo> stallInfos,
            BigDecimal totalAmount) {
        try {
            log.info("Processing reservation directly (RabbitMQ unavailable)");

            // Generate QR Code
            String qrCodeUrl = qrCodeService.generateAndUploadQRCode(
                    reservation.getId(),
                    request.getBusinessName() != null ? request.getBusinessName() : reservation.getBusinessName(),
                    request.getUserEmail() != null ? request.getUserEmail() : reservation.getUserEmail());

            reservation.setQrCodeUrl(qrCodeUrl);
            reservationRepository.save(reservation);

            // Send Email
            ReservationConfirmationDto emailDto = ReservationConfirmationDto.builder()
                    .reservationId(reservation.getId())
                    .userEmail(request.getUserEmail() != null ? request.getUserEmail() : reservation.getUserEmail())
                    .businessName(request.getBusinessName() != null ? request.getBusinessName()
                            : reservation.getBusinessName())
                    .totalAmount(totalAmount)
                    .stalls(stallInfos)
                    .qrCodeUrl(qrCodeUrl)
                    .build();

            emailService.sendReservationConfirmation(emailDto);

            log.info("✅ Direct processing completed");

        } catch (Exception e) {
            log.error("❌ Direct processing also failed", e);
        }
    }

    public ReservationResponse getReservationById(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        ReservationResponse response = mapToResponse(reservation);

        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            List<ReservationConfirmationDto.StallInfo> stallInfo = getStallsInfoByIds(
                    Collections.singletonList(reservation.getStallId()));

            response.setStalls(stallInfo.stream()
                    .map(s -> ReservationResponse.StallSummary.builder()
                            .id(s.getId())
                            .stallName(s.getStallName())
                            .size(s.getSize())
                            .dimension(s.getDimension())
                            .price(s.getPrice())
                            .build())
                    .collect(Collectors.toList()));
        }

        return response;
    }

    public List<ReservationResponse> getReservationsByUserId(Long userId) {
        return reservationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(reservation -> mapToResponse(reservation))
                .collect(Collectors.toList());
    }

    public ReservationResponse updateReservation(Long id, UpdateReservationRequest request) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        if (request.getNotes() != null) {
            reservation.setNotes(request.getNotes());
        }

        if (request.getStatus() != null) {
            reservation.setStatus(ReservationStatus.valueOf(request.getStatus().toUpperCase()));
        }

        return mapToResponse(reservationRepository.save(reservation));
    }

    public void cancelReservation(Long id, Long userId) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BadRequestException("Reservation is already cancelled");
        }

        try {
            log.info("🔄 Updating stall {} status to AVAILABLE", reservation.getStallId());
            stallServiceClient.updateStallStatus(reservation.getStallId(), StallStatus.AVAILABLE);
            log.info("✅ Stall {} status updated successfully", reservation.getStallId());
        } catch (Exception e) {
            log.error("❌ Failed to update stall status for stall: {}", reservation.getStallId(), e);
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        reservation.setCancelledBy(userId.toString()); // Convert Long to String
        reservation.setQrCodeUrl(null);

        reservationRepository.save(reservation);
        lockService.releaseLock(reservation.getStallId().toString());
        eventPublisher.publishReservationCancelled(id, reservation.getUserId(), reservation.getStallId());

        log.info("✅ Reservation {} cancelled by user {}", id, userId);
    }

    public void cleanupExpiredHolds() {
        List<Reservation> expiredReservations = reservationRepository.findExpiredHolds(LocalDateTime.now());
        log.info("Cleaning up {} expired holds", expiredReservations.size());

        expiredReservations.forEach(reservation -> {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservation.setQrCodeUrl(null);
            reservationRepository.save(reservation);
            lockService.releaseLock(reservation.getStallId().toString());
            log.info("Expired hold cleaned up: reservationId={}, stallId={}",
                    reservation.getId(), reservation.getStallId());
        });
    }

    private ReservationResponse mapToResponse(Reservation reservation) {
        return ReservationResponse.builder()
                .id(reservation.getId())
                .userId(reservation.getUserId())
                .userEmail(reservation.getUserEmail())
                .businessName(reservation.getBusinessName())
                .stallId(reservation.getStallId())
                .status(reservation.getStatus().name())
                .totalAmount(reservation.getTotalAmount())
                .notes(reservation.getNotes())
                .createdAt(reservation.getCreatedAt())
                .confirmedAt(reservation.getConfirmedAt())
                .qrCodeUrl(reservation.getQrCodeUrl())
                .build();
    }

    private List<ReservationConfirmationDto.StallInfo> getStallsInfoByIds(List<Long> stallIds) {
        try {
            // FIX: Convert List<Long> to comma-separated String for Feign client
            String commaSeparatedIds = stallIds.stream()
                    .map(Object::toString)
                    .collect(Collectors.joining(","));

            // Handle ResponseEntity return type properly
            ResponseEntity<List<StallResponse>> stallResponseEntity = stallServiceClient
                    .getStallsByIds(commaSeparatedIds);

            List<StallResponse> stallResponses = stallResponseEntity.getBody();
            if (stallResponses == null) {
                log.warn("Received null response body from StallServiceClient for IDs: {}", stallIds);
                return Collections.emptyList();
            }

            return stallResponses.stream()
                    .map(stall -> ReservationConfirmationDto.StallInfo.builder()
                            .id(stall.getId())
                            .stallName(stall.getStallName())
                            .size(stall.getSize())
                            .dimension(stall.getDimension())
                            .price(stall.getPrice())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to get stall information for IDs: {}", stallIds, e);
            return Collections.emptyList();
        }
    }
}