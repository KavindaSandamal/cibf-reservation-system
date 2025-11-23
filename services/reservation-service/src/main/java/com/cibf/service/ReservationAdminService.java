package com.cibf.service;

import com.cibf.client.StallServiceClient;
import com.cibf.dto.*;
import com.cibf.entity.Reservation;
import com.cibf.entity.ReservationStatus;
import com.cibf.exception.ResourceNotFoundException;
import com.cibf.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationAdminService {

    private final ReservationRepository reservationRepository;
    private final StallServiceClient stallServiceClient;
    private final EmailService emailService;

    /**
     * Get all reservations with filters
     */
    @Transactional(readOnly = true)
    public Page<ReservationResponse> getAllReservationsFiltered(
            String status,
            String search,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {

        log.info("Fetching reservations - status: {}, search: {}", status, search);

        Specification<Reservation> spec = Specification.where(null);

        if (status != null && !status.isEmpty()) {
            ReservationStatus reservationStatus = ReservationStatus.valueOf(status.toUpperCase());
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), reservationStatus));
        }

        if (search != null && !search.isEmpty()) {
            // Remove # prefix if present (users might type #1, #25, etc.)
            String searchTerm = search.trim();
            if (searchTerm.startsWith("#")) {
                searchTerm = searchTerm.substring(1);
            }
            
            final String finalSearchTerm = searchTerm;
            
            spec = spec.and((root, query, cb) -> {
                // Try to parse as Long for ID search
                try {
                    Long searchId = Long.parseLong(finalSearchTerm);
                    // Search by ID (exact match) OR email/business name (partial match)
                    return cb.or(
                            cb.equal(root.get("id"), searchId),
                            cb.like(cb.lower(root.get("userEmail")), "%" + finalSearchTerm.toLowerCase() + "%"),
                            cb.like(cb.lower(root.get("businessName")), "%" + finalSearchTerm.toLowerCase() + "%")
                    );
                } catch (NumberFormatException e) {
                    // Not a number, search only by email and business name
                    return cb.or(
                            cb.like(cb.lower(root.get("userEmail")), "%" + finalSearchTerm.toLowerCase() + "%"),
                            cb.like(cb.lower(root.get("businessName")), "%" + finalSearchTerm.toLowerCase() + "%")
                    );
                }
            });
        }

        if (startDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
        }

        if (endDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
        }

        return reservationRepository.findAll(spec, pageable)
                .map(reservation -> this.mapToReservationResponse(reservation));
    }

    /**
     * Get detailed reservation by ID
     */
    @Transactional(readOnly = true)
    public ReservationResponse getReservationDetail(Long id) {
        log.info("Fetching reservation detail for ID: {}", id);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        return mapToReservationResponse(reservation);
    }

    /**
     * Get reservations by user ID
     */
    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservationsByUserId(Long userId) {
        log.info("Fetching reservations for user ID: {}", userId);

        List<Reservation> reservations = reservationRepository.findByUserId(userId);
        return reservations.stream()
                .map(reservation -> this.mapToReservationResponse(reservation))
                .collect(Collectors.toList());
    }

    /**
     * Get reservation by stall ID
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getReservationByStallId(Long stallId) {
        log.info("Fetching reservation for stall ID: {}", stallId);

        Optional<Reservation> reservationOpt = reservationRepository.findByStallIdAndStatus(
                stallId, ReservationStatus.CONFIRMED);

        if (reservationOpt.isEmpty()) {
            return Map.of("stallId", stallId, "reserved", false);
        }

        Reservation reservation = reservationOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("stallId", stallId);
        response.put("reserved", true);
        response.put("reservationId", reservation.getId());
        response.put("userEmail", reservation.getUserEmail());
        response.put("businessName", reservation.getBusinessName());
        response.put("reservedDate", reservation.getConfirmedAt());

        return response;
    }

    /**
     * Cancel reservation
     */
    @Transactional
    public void cancelReservation(Long id, String reason) {
        log.info("Cancelling reservation ID: {}, reason: {}", id, reason);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        reservation.setCancelledBy("ADMIN");
        reservation.setCancellationReason(reason != null ? reason : "Cancelled by admin");

        reservationRepository.save(reservation);

        log.info("Reservation {} cancelled successfully", id);
    }

    /**
     * Resend confirmation email
     */
    @Transactional(readOnly = true)
    public void resendConfirmationEmail(Long id) {
        log.info("Resending confirmation email for reservation ID: {}", id);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("Cannot resend email for non-confirmed reservation");
        }

        // Fetch stall details - FIX: Convert Long to String for Feign client
        String stallIdString = String.valueOf(reservation.getStallId());
        ResponseEntity<List<StallResponse>> stallResponseEntity = stallServiceClient.getStallsByIds(stallIdString);
        List<StallResponse> stallDetails = stallResponseEntity.getBody();

        if (stallDetails == null) {
            stallDetails = Collections.emptyList();
        }

        ReservationConfirmationDto emailDto = ReservationConfirmationDto.builder()
                .reservationId(reservation.getId())
                .userEmail(reservation.getUserEmail())
                .businessName(reservation.getBusinessName())
                .totalAmount(reservation.getTotalAmount())
                .qrCodeUrl(reservation.getQrCodeUrl())
                .stalls(stallDetails.stream()
                        .map(s -> ReservationConfirmationDto.StallInfo.builder()
                                .id(s.getId())
                                .stallName(s.getStallName())
                                .size(s.getSize())
                                .dimension(s.getDimension())
                                .price(s.getPrice())
                                .build())
                        .collect(Collectors.toList()))
                .build();

        emailService.sendReservationConfirmation(emailDto);

        log.info("Confirmation email resent successfully for reservation {}", id);
    }

    /**
     * Get reservation statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getReservationStatistics() {
        log.info("Fetching reservation statistics");

        Map<String, Object> stats = new HashMap<>();

        // Total counts
        stats.put("totalReservations", reservationRepository.count());
        stats.put("confirmedReservations", reservationRepository.countByStatus(ReservationStatus.CONFIRMED));
        stats.put("cancelledReservations", reservationRepository.countByStatus(ReservationStatus.CANCELLED));
        stats.put("pendingReservations", reservationRepository.countByStatus(ReservationStatus.PENDING));

        // Recent reservations (last 10)
        List<Reservation> recent = reservationRepository.findTop10ByOrderByCreatedAtDesc();
        stats.put("recentReservations", recent.stream()
                .map(reservation -> this.mapToReservationResponse(reservation))
                .collect(Collectors.toList()));

        return stats;
    }

    /**
     * Get revenue statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getRevenueStatistics(String period) {
        log.info("Fetching revenue statistics for period: {}", period);

        Map<String, Object> revenue = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate;

        switch (period.toLowerCase()) {
            case "daily":
                startDate = now.toLocalDate().atStartOfDay();
                break;
            case "weekly":
                startDate = now.minusWeeks(1);
                break;
            case "monthly":
                startDate = now.minusMonths(1);
                break;
            case "yearly":
                startDate = now.minusYears(1);
                break;
            default:
                startDate = now.minusMonths(1);
        }

        // Total revenue
        List<Reservation> reservations = reservationRepository.findByStatusAndCreatedAtBetween(
                ReservationStatus.CONFIRMED, startDate, now);

        BigDecimal totalRevenue = reservations.stream()
                .map(Reservation::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        revenue.put("totalRevenue", totalRevenue);
        revenue.put("period", period);
        revenue.put("startDate", startDate);
        revenue.put("endDate", now);
        revenue.put("reservationCount", reservations.size());

        // Average booking amount
        if (!reservations.isEmpty()) {
            BigDecimal avgAmount = totalRevenue.divide(
                    BigDecimal.valueOf(reservations.size()), 2, BigDecimal.ROUND_HALF_UP);
            revenue.put("averageBookingAmount", avgAmount);
        } else {
            revenue.put("averageBookingAmount", BigDecimal.ZERO);
        }

        return revenue;
    }

    /**
     * Get booking trends
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getBookingTrends(String period) {
        log.info("Fetching booking trends for period: {}", period);

        Map<String, Object> trends = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate;

        switch (period.toLowerCase()) {
            case "weekly":
                startDate = now.minusWeeks(4); // Last 4 weeks
                break;
            case "monthly":
                startDate = now.minusMonths(6); // Last 6 months
                break;
            case "yearly":
                startDate = now.minusYears(2); // Last 2 years
                break;
            default:
                startDate = now.minusWeeks(4);
        }

        List<Reservation> reservations = reservationRepository.findByCreatedAtBetween(startDate, now);

        // Group by date
        Map<LocalDate, Long> dailyCounts = reservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getCreatedAt().toLocalDate(),
                        Collectors.counting()));

        trends.put("period", period);
        trends.put("startDate", startDate);
        trends.put("endDate", now);
        trends.put("dailyBookings", dailyCounts);
        trends.put("totalBookings", reservations.size());

        // Peak booking day
        if (!dailyCounts.isEmpty()) {
            Map.Entry<LocalDate, Long> peakDay = dailyCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElse(null);

            if (peakDay != null) {
                trends.put("peakBookingDate", peakDay.getKey());
                trends.put("peakBookingCount", peakDay.getValue());
            }
        }

        return trends;
    }

    /**
     * Get dashboard summary
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardSummary() {
        log.info("Fetching dashboard summary");

        Map<String, Object> summary = new HashMap<>();

        // Total counts
        long totalReservations = reservationRepository.count();
        long confirmedReservations = reservationRepository.countByStatus(ReservationStatus.CONFIRMED);
        long cancelledReservations = reservationRepository.countByStatus(ReservationStatus.CANCELLED);

        summary.put("totalReservations", totalReservations);
        summary.put("confirmedReservations", confirmedReservations);
        summary.put("cancelledReservations", cancelledReservations);
        summary.put("pendingReservations", totalReservations - confirmedReservations - cancelledReservations);

        // Total revenue
        List<Reservation> confirmedList = reservationRepository.findByStatus(ReservationStatus.CONFIRMED);
        BigDecimal totalRevenue = confirmedList.stream()
                .map(Reservation::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        summary.put("totalRevenue", totalRevenue);

        // Average booking amount
        if (!confirmedList.isEmpty()) {
            BigDecimal avgAmount = totalRevenue.divide(
                    BigDecimal.valueOf(confirmedList.size()), 2, BigDecimal.ROUND_HALF_UP);
            summary.put("averageBookingAmount", avgAmount);
        } else {
            summary.put("averageBookingAmount", BigDecimal.ZERO);
        }

        // Today's bookings
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        long todayBookings = reservationRepository.countByCreatedAtBetween(todayStart, todayEnd);
        summary.put("todayBookings", todayBookings);

        // This week's bookings
        LocalDateTime weekStart = LocalDate.now().atStartOfDay().minusWeeks(1);
        long weekBookings = reservationRepository.countByCreatedAtBetween(weekStart, LocalDateTime.now());
        summary.put("weekBookings", weekBookings);

        // Recent reservations (last 5)
        List<Reservation> recent = reservationRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .limit(5)
                .collect(Collectors.toList());

        summary.put("recentReservations", recent.stream()
                .map(reservation -> this.mapToReservationResponse(reservation))
                .collect(Collectors.toList()));

        return summary;
    }

    /**
     * Export reservations to CSV
     */
    public byte[] exportReservationsToCSV() {
        log.info("Exporting reservations to CSV");

        List<Reservation> reservations = reservationRepository.findAll();
        StringBuilder csv = new StringBuilder();

        // CSV Header
        csv.append("ID,User Email,Business Name,Stall ID,Status,Total Amount,QR Code URL,Created At,Confirmed At\n");

        // CSV Data
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (Reservation reservation : reservations) {
            csv.append(String.format("%d,\"%s\",\"%s\",%d,%s,%.2f,\"%s\",%s,%s\n",
                    reservation.getId(),
                    reservation.getUserEmail() != null ? reservation.getUserEmail() : "",
                    reservation.getBusinessName() != null ? reservation.getBusinessName() : "",
                    reservation.getStallId(),
                    reservation.getStatus(),
                    reservation.getTotalAmount(),
                    reservation.getQrCodeUrl() != null ? reservation.getQrCodeUrl() : "",
                    reservation.getCreatedAt().format(formatter),
                    reservation.getConfirmedAt() != null ? reservation.getConfirmedAt().format(formatter) : ""));
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Map Reservation entity to ReservationResponse DTO
     */
    private ReservationResponse mapToReservationResponse(Reservation reservation) {
        // Fetch stall details - FIX: Convert Long to String for Feign client
        List<StallResponse> stallDetails = new ArrayList<>();
        try {
            String stallIdString = String.valueOf(reservation.getStallId());
            ResponseEntity<List<StallResponse>> stallResponseEntity = stallServiceClient.getStallsByIds(stallIdString);
            if (stallResponseEntity.getBody() != null) {
                stallDetails = stallResponseEntity.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to fetch stall details for reservation {}: {}",
                    reservation.getId(), e.getMessage());
        }

        List<ReservationResponse.StallSummary> stallInfos = stallDetails.stream()
                .map(stall -> ReservationResponse.StallSummary.builder()
                        .id(stall.getId())
                        .stallName(stall.getStallName())
                        .size(stall.getSize())
                        .price(stall.getPrice())
                        .build())
                .collect(Collectors.toList());

        return ReservationResponse.builder()
                .id(reservation.getId())
                .userEmail(reservation.getUserEmail())
                .businessName(reservation.getBusinessName())
                .createdAt(reservation.getCreatedAt())
                .status(reservation.getStatus().name())
                .totalAmount(reservation.getTotalAmount())
                .qrCodeUrl(reservation.getQrCodeUrl())
                .stalls(stallInfos)
                .createdAt(reservation.getCreatedAt())
                .build();
    }
}