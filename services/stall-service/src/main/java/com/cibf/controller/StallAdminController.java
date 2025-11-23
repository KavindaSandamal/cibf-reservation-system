package com.cibf.controller;

import com.cibf.dto.StallMapDTO;
import com.cibf.dto.StallResponseDTO;
import com.cibf.dto.StallStatisticsDTO;
import com.cibf.entity.Stall.StallSize;
import com.cibf.entity.Stall.StallStatus;
import com.cibf.service.StallAdminService;
import com.cibf.service.StallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin Controller for Stall Management
 * Employee Portal endpoints for viewing and managing stalls
 */
@RestController
@RequestMapping("/api/admin/stalls")
@RequiredArgsConstructor
@Slf4j
public class StallAdminController {

    private final StallService stallService;
    private final StallAdminService stallAdminService;

    /**
     * Get all stalls with optional filters and pagination
     * GET
     * /api/admin/stalls?status={status}&size={size}&page={page}&sizePerPage={sizePerPage}
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Page<StallResponseDTO>> getAllStallsAdmin(
            @RequestParam(required = false) StallStatus status,
            @RequestParam(required = false, name = "stallSize") StallSize size,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10", name = "sizePerPage") int sizePerPage) {

        log.info("Admin fetching stalls - status: {}, size: {}, page: {}, sizePerPage: {}", status, size, page,
                sizePerPage);

        Pageable pageable = PageRequest.of(page, sizePerPage);
        Page<StallResponseDTO> stalls;

        if (status != null && size != null) {
            stalls = stallAdminService.getStallsByStatusAndSize(status, size, pageable);
        } else if (status != null) {
            stalls = stallAdminService.getStallsByStatus(status, pageable);
        } else if (size != null) {
            stalls = stallAdminService.getStallsBySize(size, pageable);
        } else {
            stalls = stallAdminService.getAllStalls(pageable);
        }

        return ResponseEntity.ok(stalls);
    }

    /**
     * Get specific stall details with reservation info
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getStallDetailAdmin(@PathVariable Long id) {
        log.info("Admin fetching stall details for ID: {}", id);
        Map<String, Object> stallDetail = stallAdminService.getStallDetailWithReservation(id);
        return ResponseEntity.ok(stallDetail);
    }

    /**
     * Get reservation info for a specific stall
     */
    @GetMapping("/{id}/reservation")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getStallReservationInfo(@PathVariable Long id) {
        log.info("Admin fetching reservation info for stall ID: {}", id);
        Map<String, Object> reservationInfo = stallAdminService.getStallReservationInfo(id);
        return ResponseEntity.ok(reservationInfo);
    }

    /**
     * Get stall statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<StallStatisticsDTO> getStallStatistics() {
        log.info("Admin fetching stall statistics");
        StallStatisticsDTO statistics = stallAdminService.getStallStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get stall distribution by size
     */
    @GetMapping("/statistics/distribution")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getStallDistribution() {
        log.info("Admin fetching stall distribution");
        Map<String, Object> distribution = stallAdminService.getStallDistribution();
        return ResponseEntity.ok(distribution);
    }

    /**
     * Get stall occupancy rate
     */
    @GetMapping("/statistics/occupancy")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getOccupancyRate() {
        log.info("Admin fetching occupancy rate");
        Map<String, Object> occupancy = stallAdminService.getOccupancyRate();
        return ResponseEntity.ok(occupancy);
    }

    /**
     * Get stalls for map display
     */
    @GetMapping("/map")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<StallMapDTO>> getStallsForMapAdmin() {
        log.info("Admin fetching stalls for map");
        return ResponseEntity.ok(stallService.getStallsForMap());
    }

    /**
     * Export stalls to CSV
     */
    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<ByteArrayResource> exportStalls() throws IOException {
        List<StallResponseDTO> stalls = stallService.getAllStalls();

        // Convert to CSV
        String csv = "StallName,Size,Status,Price,LocationX,LocationY\n" +
                stalls.stream()
                        .map(s -> String.join(",",
                                s.getStallName(),
                                s.getSize().name(),
                                s.getStatus().name(),
                                s.getPrice().toString(),
                                s.getLocationX().toString(),
                                s.getLocationY().toString()))
                        .collect(Collectors.joining("\n"));

        ByteArrayResource resource = new ByteArrayResource(csv.getBytes());

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=stalls_export.csv")
                .contentLength(csv.getBytes().length)
                .body(resource);
    }

}
