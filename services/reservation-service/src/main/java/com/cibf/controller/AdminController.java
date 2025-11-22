package com.cibf.controller;

import com.cibf.dto.ReservationResponse;
import com.cibf.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin/Employee-only controller for statistics and admin operations
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*") // Configure properly in production
public class AdminController {

    private final ReservationService reservationService;

    /**
     * Debug endpoint to check authentication status
     * Remove this in production
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

    /**
     * Get dashboard statistics summary
     * Employee Portal Usage: Dashboard statistics
     * 
     * @return Statistics summary including reservations by status, revenue, etc.
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
        Map<String, Object> statistics = reservationService.getStatisticsSummary();
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get all reservations with filters and pagination
     * Employee Portal Usage: Reservations Management page
     * 
     * @param status Optional status filter (PENDING, CONFIRMED, CANCELLED, or ALL)
     * @param search Optional search query (searches by ID, user email, or business name)
     * @param startDate Optional start date filter (YYYY-MM-DD format)
     * @param endDate Optional end date filter (YYYY-MM-DD format)
     * @param page Page number (1-based, default: 1)
     * @param size Page size (default: 10)
     * @return Paginated list of reservations
     */
    @GetMapping("/reservations")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Page<ReservationResponse>> getAllReservations(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        log.info("REST request to get all reservations: status={}, search={}, startDate={}, endDate={}, page={}, size={}",
                status, search, startDate, endDate, page, size);
        
        if (authentication != null) {
            log.info("✅ Authenticated user: {}, Authorities: {}", 
                    authentication.getName(), 
                    authentication.getAuthorities());
        } else {
            log.error("❌ No authentication found - this should not happen if @PreAuthorize worked");
        }
        
        Page<ReservationResponse> reservations = reservationService.getAllReservations(
                status, search, startDate, endDate, page, size);
        return ResponseEntity.ok(reservations);
    }

    /**
     * Get reservation by ID (admin/employee access)
     * Employee Portal Usage: View reservation details
     */
    @GetMapping("/reservations/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<ReservationResponse> getReservationById(@PathVariable Long id) {
        log.info("REST request to get reservation by ID: {}", id);
        ReservationResponse response = reservationService.getReservationById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Confirm a reservation (admin/employee action)
     * Employee Portal Usage: Confirm pending reservations
     */
    @PutMapping("/reservations/{id}/confirm")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<ReservationResponse> confirmReservation(@PathVariable Long id) {
        log.info("REST request to confirm reservation: {}", id);
        ReservationResponse response = reservationService.confirmReservationById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel a reservation (admin/employee action)
     * Employee Portal Usage: Cancel reservations
     */
    @DeleteMapping("/reservations/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Void> cancelReservation(@PathVariable Long id) {
        log.info("REST request to cancel reservation: {}", id);
        reservationService.cancelReservationById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Resend confirmation email
     * Employee Portal Usage: Resend confirmation emails
     */
    @PostMapping("/reservations/{id}/resend-email")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Void> resendConfirmationEmail(@PathVariable Long id) {
        log.info("REST request to resend confirmation email for reservation: {}", id);
        reservationService.resendConfirmationEmail(id);
        return ResponseEntity.ok().build();
    }
}


