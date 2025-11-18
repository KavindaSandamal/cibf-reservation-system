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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    /**
     * Hold stalls temporarily
     */
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

    /**
     * Confirm reservation - Generate QR code and send email
     */
    public ReservationResponse confirmReservation(ConfirmReservationRequest request) {
        log.info("Confirming reservation for user: {}, holdToken: {}", request.getUserId(), request.getHoldToken());

        // ✅ FIXED: Changed to List<Reservation>
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

        String qrCodeUrl = null;
        try {
            log.info("Generating QR code for reservation: {}", mainReservation.getId());

            qrCodeUrl = qrCodeService.generateAndUploadQRCode(
                    mainReservation.getId(),
                    request.getBusinessName() != null ? request.getBusinessName() : mainReservation.getBusinessName(),
                    request.getUserEmail() != null ? request.getUserEmail() : mainReservation.getUserEmail());

            final String finalQrCodeUrl = qrCodeUrl;
            reservations.forEach(r -> {
                r.setQrCodeUrl(finalQrCodeUrl);
                reservationRepository.save(r);
            });

            log.info("✅ QR code generated and saved: {}", qrCodeUrl);

        } catch (Exception e) {
            log.error("❌ Failed to generate QR code for reservation: {}", mainReservation.getId(), e);
        }

        try {
            log.info("Sending confirmation email to: {}", request.getUserEmail());

            ReservationConfirmationDto emailDto = ReservationConfirmationDto.builder()
                    .reservationId(mainReservation.getId())
                    .userEmail(request.getUserEmail() != null ? request.getUserEmail() : mainReservation.getUserEmail())
                    .businessName(request.getBusinessName() != null ? request.getBusinessName()
                            : mainReservation.getBusinessName())
                    .totalAmount(totalAmount)
                    .stalls(stallInfos)
                    .qrCodeUrl(qrCodeUrl)
                    .build();

            emailService.sendReservationConfirmation(emailDto);

            log.info("✅ Email notification sent successfully");

        } catch (Exception e) {
            log.error("❌ Failed to send email notification", e);
        }

        // ✅ FIXED: Removed third parameter (reservationId)
        eventPublisher.publishReservationConfirmed(mainReservation.getUserId(), stallIds);

        ReservationResponse response = mapToResponse(mainReservation);
        response.setQrCodeUrl(qrCodeUrl);
        response.setStalls(stallInfos.stream()
                .map(s -> ReservationResponse.StallSummary.builder()
                        .id(s.getId())
                        .stallName(s.getStallName())
                        .size(s.getSize())
                        .dimensions(s.getDimensions())
                        .price(s.getPrice())
                        .build())
                .collect(Collectors.toList()));
        response.setTotalAmount(totalAmount);

        log.info("✅ Reservation confirmed successfully: ID={}, QR={}", mainReservation.getId(), qrCodeUrl);

        return response;
    }

    public ReservationResponse getReservationById(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        ReservationResponse response = mapToResponse(reservation);

        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            List<ReservationConfirmationDto.StallInfo> stallInfo = getStallsInfoByIds(
                    List.of(reservation.getStallId()));

            response.setStalls(stallInfo.stream()
                    .map(s -> ReservationResponse.StallSummary.builder()
                            .id(s.getId())
                            .stallName(s.getStallName())
                            .size(s.getSize())
                            .dimensions(s.getDimensions())
                            .price(s.getPrice())
                            .build())
                    .collect(Collectors.toList()));
        }

        return response;
    }

    public List<ReservationResponse> getReservationsByUserId(Long userId) {
        return reservationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
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
            stallServiceClient.updateStallStatus(reservation.getStallId(), "AVAILABLE");
        } catch (Exception e) {
            log.error("Failed to update stall status for stall: {}", reservation.getStallId(), e);
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        reservation.setCancelledBy(userId);
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

    // ✅ FIXED: Explicit type for StallResponse
    private List<ReservationConfirmationDto.StallInfo> getStallsInfoByIds(List<Long> stallIds) {
        try {
            List<StallResponse> stallResponses = stallServiceClient.getStallsByIds(stallIds);

            return stallResponses.stream()
                    .map(stall -> ReservationConfirmationDto.StallInfo.builder()
                            .id(stall.getId())
                            .stallName(stall.getStallName())
                            .size(stall.getSize())
                            .dimensions(stall.getDimensions())
                            .price(stall.getPrice())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to get stall information for IDs: {}", stallIds, e);
            return List.of();
        }
    }

    private String generateConfirmationCode(Long reservationId) {
        return String.format("CIBF-%04d", reservationId);
    }
}