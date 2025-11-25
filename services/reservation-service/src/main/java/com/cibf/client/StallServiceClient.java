package com.cibf.client;

import com.cibf.config.FeignClientConfig;
import com.cibf.dto.HoldStallRequest;
import com.cibf.dto.StallResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Feign Client for communication with the Stall Service.
 */
@FeignClient(name = "stall-service", url = "http://stall-service:8082", configuration = FeignClientConfig.class // ← ADD
                                                                                                                // THIS
)
public interface StallServiceClient {

    // 1. Hold Stalls (Used by ReservationService's /hold endpoint)
    @PostMapping("/api/stalls/hold")
    ResponseEntity<List<StallResponse>> holdStalls(@RequestBody HoldStallRequest request);

    // 2. Get Stalls by IDs (Used for fetching initial stall data)
    @GetMapping("/api/stalls/by-ids")
    ResponseEntity<List<StallResponse>> getStallsByIds(@RequestParam("ids") String commaSeparatedIds);

    // 3. Confirm Stalls (Used by Reservation Consumer after payment/confirmation)
    @PostMapping("/api/stalls/confirm/{reservationId}")
    ResponseEntity<Void> confirmStallsByReservationId(@PathVariable Long reservationId);

    // 4. Update Stall Status (Used for cancellation/cleanup)
    @PostMapping("/api/stalls/{stallId}/status")
    ResponseEntity<Void> updateStallStatus(
            @PathVariable Long stallId,
            @RequestParam String status);

    // 5. Get Stalls by Reservation ID
    @GetMapping("/api/stalls/reservation/{reservationId}")
    ResponseEntity<List<StallResponse>> getStallsByReservationId(@PathVariable Long reservationId);
}