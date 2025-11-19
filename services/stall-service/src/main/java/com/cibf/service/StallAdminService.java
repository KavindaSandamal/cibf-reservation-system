package com.cibf.service;

import com.cibf.dto.StallResponseDTO;
import com.cibf.dto.StallStatisticsDTO;
import com.cibf.entity.Stall;
import com.cibf.entity.Stall.StallSize;
import com.cibf.entity.Stall.StallStatus;
import com.cibf.exception.ResourceNotFoundException;
import com.cibf.repository.StallRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for Employee Portal stall operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StallAdminService {

    private final StallRepository stallRepository;
    private final RestTemplate restTemplate;

    @Value("${reservation.service.url:http://localhost:8083}")
    private String reservationServiceUrl;

    /**
     * Get stall details with reservation information
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStallDetailWithReservation(Long stallId) {
        Stall stall = stallRepository.findById(stallId)
                .orElseThrow(() -> new ResourceNotFoundException("Stall not found with ID: " + stallId));

        Map<String, Object> response = new HashMap<>();
        response.put("stall", new StallResponseDTO(stall));

        // Fetch reservation info if stall is reserved
        if (stall.getStatus() == StallStatus.RESERVED) {
            try {
                Map<String, Object> reservationInfo = getReservationInfoFromService(stallId);
                response.put("reservation", reservationInfo);
            } catch (Exception e) {
                log.warn("Could not fetch reservation info for stall {}: {}", stallId, e.getMessage());
                response.put("reservation", null);
            }
        } else {
            response.put("reservation", null);
        }

        return response;
    }

    /**
     * Get reservation information for a stall
     */
    public Map<String, Object> getStallReservationInfo(Long stallId) {
        Stall stall = stallRepository.findById(stallId)
                .orElseThrow(() -> new ResourceNotFoundException("Stall not found with ID: " + stallId));

        if (stall.getStatus() != StallStatus.RESERVED) {
            Map<String, Object> response = new HashMap<>();
            response.put("reserved", false);
            response.put("message", "Stall is not currently reserved");
            return response;
        }

        return getReservationInfoFromService(stallId);
    }

    /**
     * Get stall statistics for dashboard
     */
    @Transactional(readOnly = true)
    public StallStatisticsDTO getStallStatistics() {
        long totalStalls = stallRepository.count();
        long availableStalls = stallRepository.countByStatus(StallStatus.AVAILABLE);
        long reservedStalls = stallRepository.countByStatus(StallStatus.RESERVED);
        long unavailableStalls = stallRepository.countByStatus(StallStatus.UNAVAILABLE);

        // Count by size
        long smallStalls = stallRepository.countBySize(StallSize.SMALL);
        long mediumStalls = stallRepository.countBySize(StallSize.MEDIUM);
        long largeStalls = stallRepository.countBySize(StallSize.LARGE);

        // Available by size
        long smallAvailable = stallRepository.countBySizeAndStatus(StallSize.SMALL, StallStatus.AVAILABLE);
        long mediumAvailable = stallRepository.countBySizeAndStatus(StallSize.MEDIUM, StallStatus.AVAILABLE);
        long largeAvailable = stallRepository.countBySizeAndStatus(StallSize.LARGE, StallStatus.AVAILABLE);

        double occupancyRate = totalStalls > 0 ? (double) reservedStalls / totalStalls * 100 : 0;

        return StallStatisticsDTO.builder()
                .totalStalls(totalStalls)
                .availableStalls(availableStalls)
                .reservedStalls(reservedStalls)
                .unavailableStalls(unavailableStalls)
                .smallStalls(smallStalls)
                .mediumStalls(mediumStalls)
                .largeStalls(largeStalls)
                .smallAvailable(smallAvailable)
                .mediumAvailable(mediumAvailable)
                .largeAvailable(largeAvailable)
                .occupancyRate(occupancyRate)
                .build();
    }

    /**
     * Get stall distribution by size
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStallDistribution() {
        Map<String, Object> distribution = new HashMap<>();

        distribution.put("SMALL", stallRepository.countBySize(StallSize.SMALL));
        distribution.put("MEDIUM", stallRepository.countBySize(StallSize.MEDIUM));
        distribution.put("LARGE", stallRepository.countBySize(StallSize.LARGE));

        return distribution;
    }

    /**
     * Get stall occupancy rate
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getOccupancyRate() {
        long totalStalls = stallRepository.count();
        long reservedStalls = stallRepository.countByStatus(StallStatus.RESERVED);

        double occupancyRate = totalStalls > 0 ? (double) reservedStalls / totalStalls * 100 : 0;

        Map<String, Object> occupancy = new HashMap<>();
        occupancy.put("totalStalls", totalStalls);
        occupancy.put("reservedStalls", reservedStalls);
        occupancy.put("availableStalls", totalStalls - reservedStalls);
        occupancy.put("occupancyRate", Math.round(occupancyRate * 100.0) / 100.0);

        return occupancy;
    }

    /**
     * Fetch reservation info from Reservation Service
     */
    private Map<String, Object> getReservationInfoFromService(Long stallId) {
        try {
            String url = reservationServiceUrl + "/api/admin/reservations/stall/" + stallId;
            log.debug("Fetching reservation info from: {}", url);

            @SuppressWarnings("unchecked")
            Map<String, Object> reservation = restTemplate.getForObject(url, Map.class);

            return reservation != null ? reservation : new HashMap<>();
        } catch (Exception e) {
            log.error("Failed to fetch reservation info for stall {}: {}", stallId, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Could not fetch reservation information");
            return error;
        }
    }

    public Page<StallResponseDTO> getAllStalls(Pageable pageable) {
        return stallRepository.findAll(pageable)
                .map(StallResponseDTO::new);
    }

    public Page<StallResponseDTO> getStallsByStatus(StallStatus status, Pageable pageable) {
        return stallRepository.findByStatus(status, pageable)
                .map(StallResponseDTO::new);
    }

    public Page<StallResponseDTO> getStallsBySize(StallSize size, Pageable pageable) {
        return stallRepository.findBySize(size, pageable)
                .map(StallResponseDTO::new);
    }

    public Page<StallResponseDTO> getStallsByStatusAndSize(StallStatus status, StallSize size, Pageable pageable) {
        return stallRepository.findBySizeAndStatus(size, status, pageable)
                .map(StallResponseDTO::new);
    }
}