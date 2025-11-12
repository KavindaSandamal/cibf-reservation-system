package com.cibf.reservation.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "stall-service", url = "http://localhost:8082/api/stalls")
public interface StallServiceClient {

    @GetMapping("/{stallId}/available")
    boolean isStallAvailable(@PathVariable("stallId") Long stallId);

    @PutMapping("/{stallId}/status")
    void updateStallStatus(@PathVariable("stallId") Long stallId,
                           @RequestParam("status") String status);
}
