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
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

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

    /**
     * Admin/Employee confirmation of a pending reservation (by ID only, no hold token required)
     */
    @Transactional
    public ReservationResponse confirmReservationById(Long id) {
        log.info("Admin confirming reservation by ID: {}", id);
        
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new BadRequestException("Only PENDING reservations can be confirmed. Current status: " + reservation.getStatus());
        }

        // Find all reservations with the same hold token (if exists) or just this one
        List<Reservation> reservationsToConfirm;
        if (reservation.getHoldToken() != null) {
            reservationsToConfirm = reservationRepository.findByUserIdAndHoldToken(
                    reservation.getUserId(), reservation.getHoldToken());
        } else {
            reservationsToConfirm = List.of(reservation);
        }

        LocalDateTime confirmedAt = LocalDateTime.now();
        reservationsToConfirm.forEach(r -> {
            r.setStatus(ReservationStatus.CONFIRMED);
            r.setConfirmedAt(confirmedAt);
            reservationRepository.save(r);
        });

        Reservation mainReservation = reservationsToConfirm.get(0);
        List<Long> stallIds = reservationsToConfirm.stream()
                .map(Reservation::getStallId)
                .collect(Collectors.toList());

        List<ReservationConfirmationDto.StallInfo> stallInfos = getStallsInfoByIds(stallIds);
        BigDecimal totalAmount = stallInfos.stream()
                .map(ReservationConfirmationDto.StallInfo::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        reservationsToConfirm.forEach(r -> r.setTotalAmount(totalAmount));

        String qrCodeUrl = null;
        try {
            qrCodeUrl = qrCodeService.generateAndUploadQRCode(
                    mainReservation.getId(),
                    mainReservation.getBusinessName(),
                    mainReservation.getUserEmail());
            final String finalQrCodeUrl = qrCodeUrl;
            reservationsToConfirm.forEach(r -> {
                r.setQrCodeUrl(finalQrCodeUrl);
                reservationRepository.save(r);
            });
        } catch (Exception e) {
            log.error("Failed to generate QR code for reservation: {}", mainReservation.getId(), e);
        }

        try {
            ReservationConfirmationDto emailDto = ReservationConfirmationDto.builder()
                    .reservationId(mainReservation.getId())
                    .userEmail(mainReservation.getUserEmail())
                    .businessName(mainReservation.getBusinessName())
                    .totalAmount(totalAmount)
                    .stalls(stallInfos)
                    .qrCodeUrl(qrCodeUrl)
                    .build();
            emailService.sendReservationConfirmation(emailDto);
        } catch (Exception e) {
            log.error("Failed to send email notification", e);
        }

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

        log.info("✅ Reservation {} confirmed by admin", id);
        return response;
    }

    /**
     * Admin/Employee cancellation of a reservation (by ID only, no userId required)
     */
    @Transactional
    public void cancelReservationById(Long id) {
        log.info("Admin cancelling reservation by ID: {}", id);
        
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
        reservation.setCancelledBy(reservation.getUserId()); // Admin cancelling on behalf of user
        reservation.setQrCodeUrl(null);

        reservationRepository.save(reservation);
        lockService.releaseLock(reservation.getStallId().toString());
        eventPublisher.publishReservationCancelled(id, reservation.getUserId(), reservation.getStallId());

        log.info("✅ Reservation {} cancelled by admin", id);
    }

    /**
     * Resend confirmation email for a confirmed reservation
     */
    public void resendConfirmationEmail(Long id) {
        log.info("Resending confirmation email for reservation: {}", id);
        
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BadRequestException("Can only resend email for CONFIRMED reservations. Current status: " + reservation.getStatus());
        }

        List<Long> stallIds = List.of(reservation.getStallId());
        List<ReservationConfirmationDto.StallInfo> stallInfos = getStallsInfoByIds(stallIds);

        try {
            ReservationConfirmationDto emailDto = ReservationConfirmationDto.builder()
                    .reservationId(reservation.getId())
                    .userEmail(reservation.getUserEmail())
                    .businessName(reservation.getBusinessName())
                    .totalAmount(reservation.getTotalAmount())
                    .stalls(stallInfos)
                    .qrCodeUrl(reservation.getQrCodeUrl())
                    .build();
            emailService.sendReservationConfirmation(emailDto);
            log.info("✅ Confirmation email resent for reservation {}", id);
        } catch (Exception e) {
            log.error("Failed to resend confirmation email", e);
            throw new RuntimeException("Failed to resend confirmation email", e);
        }
    }

    /**
     * Get all reservations with filters and pagination (for admin/employee portal)
     */
    @Transactional(readOnly = true)
    public Page<ReservationResponse> getAllReservations(
            String status,
            String search,
            String startDate,
            String endDate,
            int page,
            int size) {
        log.info("Getting all reservations with filters: status={}, search={}, startDate={}, endDate={}, page={}, size={}",
                status, search, startDate, endDate, page, size);

        Pageable pageable = PageRequest.of(page - 1, size); // Frontend uses 1-based, Spring uses 0-based
        ReservationStatus statusEnum = null;
        if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                statusEnum = ReservationStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status: {}", status);
            }
        }

        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;
        if (startDate != null && !startDate.isEmpty()) {
            try {
                startDateTime = LocalDate.parse(startDate).atStartOfDay();
            } catch (Exception e) {
                log.warn("Invalid start date format: {}", startDate);
            }
        }
        if (endDate != null && !endDate.isEmpty()) {
            try {
                endDateTime = LocalDate.parse(endDate).atTime(LocalTime.MAX);
            } catch (Exception e) {
                log.warn("Invalid end date format: {}", endDate);
            }
        }

        String searchTerm = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<Reservation> reservations = reservationRepository.findAllWithFilters(
                statusEnum, startDateTime, endDateTime, searchTerm, pageable);

        // Map to response with stall information
        Page<ReservationResponse> responsePage = reservations.map(reservation -> {
            ReservationResponse response = mapToResponse(reservation);
            
            // If confirmed, fetch stall information
            if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
                try {
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
                } catch (Exception e) {
                    log.error("Failed to fetch stall info for reservation {}", reservation.getId(), e);
                }
            }
            
            return response;
        });

        log.info("Found {} reservations (page {} of {})", 
                responsePage.getTotalElements(), page, responsePage.getTotalPages());
        return responsePage;
    }

    /**
     * Get statistics summary for dashboard
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStatisticsSummary() {
        log.info("Calculating reservation statistics summary");

        // Count reservations by status
        long totalReservations = reservationRepository.count();
        long pendingReservations = reservationRepository.countByStatus(ReservationStatus.PENDING);
        long confirmedReservations = reservationRepository.countByStatus(ReservationStatus.CONFIRMED);
        long cancelledReservations = reservationRepository.countByStatus(ReservationStatus.CANCELLED);

        // Calculate total revenue from confirmed reservations
        List<Reservation> confirmedReservationsList = reservationRepository.findByStatus(ReservationStatus.CONFIRMED);
        BigDecimal totalRevenue = confirmedReservationsList.stream()
                .filter(r -> r.getTotalAmount() != null)
                .map(Reservation::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Get reservations by date (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Reservation> recentReservations = reservationRepository.findByDateRange(
                thirtyDaysAgo, LocalDateTime.now());

        // Group by date
        Map<LocalDate, Long> reservationsByDateMap = recentReservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getCreatedAt().toLocalDate(),
                        Collectors.counting()
                ));

        // Convert to list format expected by frontend
        List<Map<String, Object>> reservationsByDate = reservationsByDateMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> dateEntry = new HashMap<>();
                    dateEntry.put("date", entry.getKey().toString());
                    dateEntry.put("count", entry.getValue());
                    return dateEntry;
                })
                .collect(Collectors.toList());

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalReservations", totalReservations);
        summary.put("pendingReservations", pendingReservations);
        summary.put("confirmedReservations", confirmedReservations);
        summary.put("cancelledReservations", cancelledReservations);
        summary.put("totalRevenue", totalRevenue);
        summary.put("reservationsByDate", reservationsByDate);

        log.info("Statistics calculated: total={}, pending={}, confirmed={}, cancelled={}, revenue={}",
                totalReservations, pendingReservations, confirmedReservations, cancelledReservations, totalRevenue);

        return summary;
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