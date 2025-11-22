package com.cibf.controller;

import com.cibf.dto.*;
import com.cibf.service.ReservationService;
import com.cibf.service.ReservationAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Consolidated Admin Controller for Reservation Management
 * Employee Portal Endpoints - All admin/employee operations in one place
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*") // Configure properly in production
public class ReservationAdminController {

    private final ReservationService reservationService;
    private final ReservationAdminService reservationAdminService;

    // ========================================================================
    // DEBUG & AUTH ENDPOINTS
    // ========================================================================

    /**
     * Debug endpoint to check authentication status
     * Remove this in production
     * GET /api/admin/debug/auth
     */
    @GetMapping("/debug/auth")
    public ResponseEntity<Map<String, Object>> debugAuth(Authentication authentication) {
        Map<String, Object> debugInfo = new HashMap<>();
        if (authentication != null) {
            debugInfo.put("authenticated", true);
            debugInfo.put("name", authentication.getName());
            debugInfo.put("authorities", authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList()));
            debugInfo.put("principal", authentication.getPrincipal().getClass().getSimpleName());
        } else {
            debugInfo.put("authenticated", false);
            debugInfo.put("message", "No authentication found in SecurityContext");
        }
        return ResponseEntity.ok(debugInfo);
    }

    // ========================================================================
    // STATISTICS ENDPOINTS
    // ========================================================================

    /**
     * Get dashboard statistics summary
     * Employee Portal Usage: Dashboard statistics
     * GET /api/admin/statistics/summary
     */
    @GetMapping("/statistics/summary")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatisticsSummary(Authentication authentication) {
        log.info("REST request to get statistics summary");
        if (authentication != null) {
            log.info("User: {}, Authorities: {}", authentication.getName(),
                    authentication.getAuthorities());
        } else {
            log.warn("No authentication found for statistics request");
        }
        Map<String, Object> summary = reservationAdminService.getDashboardSummary();
        return ResponseEntity.ok(summary);
    }

    /**
     * Get reservation statistics
     * GET /api/admin/statistics/reservations
     */
    @GetMapping("/statistics/reservations")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getReservationStatistics() {
        log.info("Admin fetching reservation statistics");
        Map<String, Object> stats = reservationAdminService.getReservationStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get revenue statistics
     * GET /api/admin/statistics/revenue?period=monthly
     */
    @GetMapping("/statistics/revenue")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getRevenueStatistics(
            @RequestParam(defaultValue = "monthly") String period) {

        log.info("Admin fetching revenue statistics for period: {}", period);
        Map<String, Object> revenue = reservationAdminService.getRevenueStatistics(period);
        return ResponseEntity.ok(revenue);
    }

    /**
     * Get booking trends
     * GET /api/admin/statistics/trends?period=weekly
     */
    @GetMapping("/statistics/trends")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getBookingTrends(
            @RequestParam(defaultValue = "weekly") String period) {

        log.info("Admin fetching booking trends for period: {}", period);
        Map<String, Object> trends = reservationAdminService.getBookingTrends(period);
        return ResponseEntity.ok(trends);
    }

    // ========================================================================
    // RESERVATION MANAGEMENT ENDPOINTS
    // ========================================================================

    /**
     * Get all reservations with pagination and filters
     * Employee Portal Usage: Reservations Management page
     * Supports both query parameter styles for backward compatibility
     * 
     * GET
     * /api/admin/reservations?page=0&size=20&status=CONFIRMED&search=ABC&startDate=...&endDate=...
     * GET
     * /api/admin/reservations?status=ALL&search=&startDate=&endDate=&page=1&size=10
     */
    @GetMapping("/reservations")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllReservations(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            Authentication authentication) {

        log.info(
                "REST request to get all reservations: status={}, search={}, startDate={}, endDate={}, page={}, size={}",
                status, search, startDate, endDate, page, size);

        if (authentication != null) {
            log.info("✅ Authenticated user: {}, Authorities: {}",
                    authentication.getName(),
                    authentication.getAuthorities());
        } else {
            log.error("❌ No authentication found - this should not happen if @PreAuthorize worked");
        }

        Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ReservationResponse> reservations = reservationAdminService.getAllReservationsFiltered(
                status, search, startDate, endDate, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("reservations", reservations.getContent());
        response.put("currentPage", reservations.getNumber());
        response.put("totalItems", reservations.getTotalElements());
        response.put("totalPages", reservations.getTotalPages());
        response.put("pageSize", reservations.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * Get specific reservation by ID
     * Employee Portal Usage: View reservation details
     * GET /api/admin/reservations/{id}
     */
    @GetMapping("/reservations/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<ReservationResponse> getReservationById(@PathVariable Long id) {
        log.info("REST request to get reservation by ID: {}", id);
        ReservationResponse reservation = reservationAdminService.getReservationDetail(id);
        return ResponseEntity.ok(reservation);
    }

    /**
     * Get reservations by user ID
     * GET /api/admin/reservations/user/{userId}
     */
    @GetMapping("/reservations/user/{userId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<ReservationResponse>> getReservationsByUserId(@PathVariable Long userId) {
        log.info("Fetching reservations for user ID: {}", userId);
        List<ReservationResponse> reservations = reservationAdminService.getReservationsByUserId(userId);
        return ResponseEntity.ok(reservations);
    }

    /**
     * Get reservation by stall ID
     * GET /api/admin/reservations/stall/{stallId}
     */
    @GetMapping("/reservations/stall/{stallId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getReservationByStallId(@PathVariable Long stallId) {
        log.info("Fetching reservation for stall ID: {}", stallId);
        Map<String, Object> reservation = reservationAdminService.getReservationByStallId(stallId);
        return ResponseEntity.ok(reservation);
    }

    /**
     * Confirm a reservation (admin/employee action)
     * Employee Portal Usage: Confirm pending reservations
     * PUT /api/admin/reservations/{id}/confirm
     */
    @PutMapping("/reservations/{id}/confirm")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<ReservationResponse> confirmReservation(@PathVariable Long id) {
        log.info("REST request to confirm reservation: {}", id);
        ReservationResponse response = reservationAdminService.getReservationDetail(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel a reservation (admin/employee action)
     * Employee Portal Usage: Cancel reservations
     * DELETE /api/admin/reservations/{id}
     */
    @DeleteMapping("/reservations/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, String>> cancelReservation(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {

        log.info("REST request to cancel reservation: {}, reason: {}", id, reason);
        reservationAdminService.cancelReservation(id, reason);

        return ResponseEntity.ok(Map.of(
                "message", "Reservation cancelled successfully",
                "reservationId", id.toString()));
    }

    /**
     * Resend confirmation email
     * Employee Portal Usage: Resend confirmation emails
     * POST /api/admin/reservations/{id}/resend-email
     */
    @PostMapping("/reservations/{id}/resend-email")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, String>> resendConfirmationEmail(@PathVariable Long id) {
        log.info("REST request to resend confirmation email for reservation ID: {}", id);
        reservationAdminService.resendConfirmationEmail(id);

        return ResponseEntity.ok(Map.of(
                "message", "Confirmation email sent successfully",
                "reservationId", id.toString()));
    }

    // ========================================================================
    // EXPORT ENDPOINTS
    // ========================================================================

    /**
     * Export reservations to CSV
     * GET /api/admin/reservations/export
     */
    @GetMapping("/reservations/export")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<byte[]> exportReservations() {
        log.info("Admin exporting reservations to CSV");
        byte[] csv = reservationAdminService.exportReservationsToCSV();

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=reservations.csv")
                .header("Content-Type", "text/csv")
                .body(csv);
    }
}