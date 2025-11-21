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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin Controller for Reservation Management
 * Employee Portal Endpoints
 */
@RestController
@RequestMapping("/api/admin/reservations")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ReservationAdminController {

    private final ReservationService reservationService;
    private final ReservationAdminService reservationAdminService;

    /**
     * Get all reservations with pagination and filters
     * GET
     * /api/admin/reservations?page=0&size=20&status=CONFIRMED&search=ABC&startDate=...&endDate=...
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllReservations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("Admin fetching reservations - page: {}, size: {}, status: {}, search: {}",
                page, size, status, search);

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
     * GET /api/admin/reservations/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<ReservationResponse> getReservationById(@PathVariable Long id) {
        log.info("Admin fetching reservation ID: {}", id);
        ReservationResponse reservation = reservationAdminService.getReservationDetail(id);
        return ResponseEntity.ok(reservation);
    }

    /**
     * Get reservations by user ID
     * GET /api/reservations/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReservationResponse>> getReservationsByUserId(@PathVariable Long userId) {
        log.info("Fetching reservations for user ID: {}", userId);
        List<ReservationResponse> reservations = reservationAdminService.getReservationsByUserId(userId);
        return ResponseEntity.ok(reservations);
    }

    /**
     * Get reservation by stall ID
     * GET /api/reservations/stall/{stallId}
     */
    @GetMapping("/stall/{stallId}")
    public ResponseEntity<Map<String, Object>> getReservationByStallId(@PathVariable Long stallId) {
        log.info("Fetching reservation for stall ID: {}", stallId);
        Map<String, Object> reservation = reservationAdminService.getReservationByStallId(stallId);
        return ResponseEntity.ok(reservation);
    }

    /**
     * Cancel reservation
     * DELETE /api/admin/reservations/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, String>> cancelReservation(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {

        log.info("Admin cancelling reservation ID: {}, reason: {}", id, reason);
        reservationAdminService.cancelReservation(id, reason);

        return ResponseEntity.ok(Map.of(
                "message", "Reservation cancelled successfully",
                "reservationId", id.toString()));
    }

    /**
     * Resend confirmation email
     * POST /api/admin/reservations/{id}/resend-email
     */
    @PostMapping("/{id}/resend-email")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, String>> resendConfirmationEmail(@PathVariable Long id) {
        log.info("Admin resending confirmation email for reservation ID: {}", id);
        reservationAdminService.resendConfirmationEmail(id);

        return ResponseEntity.ok(Map.of(
                "message", "Confirmation email sent successfully",
                "reservationId", id.toString()));
    }

    /**
     * Get reservation statistics
     * GET /api/admin/statistics/reservations
     */
    @GetMapping("/statistics")
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

    /**
     * Get dashboard summary
     * GET /api/admin/statistics/summary
     */
    @GetMapping("/statistics/summary")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        log.info("Admin fetching dashboard summary");
        Map<String, Object> summary = reservationAdminService.getDashboardSummary();
        return ResponseEntity.ok(summary);
    }

    /**
     * Export reservations to CSV
     * GET /api/admin/reservations/export
     */
    @GetMapping("/export")
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