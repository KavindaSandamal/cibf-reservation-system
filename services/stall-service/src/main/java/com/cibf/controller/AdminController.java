package com.cibf.controller;

import com.cibf.service.StallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin/Employee-only controller for statistics and admin operations
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdminController {

    private final StallService stallService;

    /**
     * Get stall statistics for dashboard
     * 
     * @return
     */
    @GetMapping("/statistics/stalls")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getStallStatistics() {
        log.info("REST request to get stall statistics for admin dashboard");
        Map<String, Object> statistics = stallService.getStallStatistics();
        return ResponseEntity.ok(statistics);
    }
}
