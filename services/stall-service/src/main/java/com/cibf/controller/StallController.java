package com.cibf.controller;

import com.cibf.dto.StallMapDTO;
import com.cibf.dto.StallRequestDTO;
import com.cibf.dto.StallResponseDTO;
import com.cibf.entity.Stall.StallSize;
import com.cibf.entity.Stall.StallStatus;
import com.cibf.service.StallService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stalls")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*") // Configure properly in production
public class StallController {

    private final StallService stallService;

    /**
     * Get all stalls (accessible by all authenticated users)
     */
    @GetMapping
    public ResponseEntity<List<StallResponseDTO>> getAllStalls() {
        log.info("REST request to get all stalls");
        List<StallResponseDTO> stalls = stallService.getAllStalls();
        return ResponseEntity.ok(stalls);
    }

    /**
     * Get stall by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<StallResponseDTO> getStallById(@PathVariable Long id) {
        log.info("REST request to get stall by ID: {}", id);
        StallResponseDTO stall = stallService.getStallById(id);
        return ResponseEntity.ok(stall);
    }

    /**
     * Get available stalls only
     */
    @GetMapping("/available")
    public ResponseEntity<List<StallResponseDTO>> getAvailableStalls() {
        log.info("REST request to get available stalls");
        List<StallResponseDTO> stalls = stallService.getAvailableStalls();
        return ResponseEntity.ok(stalls);
    }

    /**
     * Get stalls for map display (simplified data)
     */
    @GetMapping("/map")
    public ResponseEntity<List<StallMapDTO>> getStallsForMap() {
        log.info("REST request to get stalls for map");
        List<StallMapDTO> stalls = stallService.getStallsForMap();
        return ResponseEntity.ok(stalls);
    }

    /**
     * Get stalls by size
     */
    @GetMapping("/size/{size}")
    public ResponseEntity<List<StallResponseDTO>> getStallsBySize(@PathVariable StallSize size) {
        log.info("REST request to get stalls by size: {}", size);
        List<StallResponseDTO> stalls = stallService.getStallsBySize(size);
        return ResponseEntity.ok(stalls);
    }

    /**
     * Get available stalls by size
     */
    @GetMapping("/size/{size}/available")
    public ResponseEntity<List<StallResponseDTO>> getAvailableStallsBySize(@PathVariable StallSize size) {
        log.info("REST request to get available stalls by size: {}", size);
        List<StallResponseDTO> stalls = stallService.getAvailableStallsBySize(size);
        return ResponseEntity.ok(stalls);
    }

    /**
     * Check if stall is available
     */
    @GetMapping("/{id}/available")
    public ResponseEntity<Map<String, Boolean>> checkStallAvailability(@PathVariable Long id) {
        log.info("REST request to check stall availability: {}", id);
        boolean isAvailable = stallService.isStallAvailable(id);
        return ResponseEntity.ok(Map.of("available", isAvailable));
    }

    /**
     * Get stall statistics (for dashboard)
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Map<String, Object>> getStallStatistics() {
        log.info("REST request to get stall statistics");
        Map<String, Object> statistics = stallService.getStallStatistics();
        return ResponseEntity.ok(statistics);
    }

    // ============ EMPLOYEE ONLY ENDPOINTS ============

    /**
     * Create a new stall (Employee only)
     */
    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<StallResponseDTO> createStall(@Valid @RequestBody StallRequestDTO requestDTO) {
        log.info("REST request to create stall: {}", requestDTO.getStallName());
        StallResponseDTO stall = stallService.createStall(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(stall);
    }

    /**
     * Update stall (Employee only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<StallResponseDTO> updateStall(
            @PathVariable Long id,
            @Valid @RequestBody StallRequestDTO requestDTO) {
        log.info("REST request to update stall: {}", id);
        StallResponseDTO stall = stallService.updateStall(id, requestDTO);
        return ResponseEntity.ok(stall);
    }

    /**
     * Update stall status (Employee only)
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<StallResponseDTO> updateStallStatus(
            @PathVariable Long id,
            @RequestParam StallStatus status) {
        log.info("REST request to update stall status: {} to {}", id, status);
        StallResponseDTO stall = stallService.updateStallStatus(id, status);
        return ResponseEntity.ok(stall);
    }

    /**
     * Delete stall (Employee only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Map<String, String>> deleteStall(@PathVariable Long id) {
        log.info("REST request to delete stall: {}", id);
        stallService.deleteStall(id);
        return ResponseEntity.ok(Map.of("message", "Stall deleted successfully"));
    }
}