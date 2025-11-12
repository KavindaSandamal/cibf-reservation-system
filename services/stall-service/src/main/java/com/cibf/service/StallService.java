package com.cibf.service;

import com.cibf.dto.StallMapDTO;
import com.cibf.dto.StallRequestDTO;
import com.cibf.dto.StallResponseDTO;
import com.cibf.entity.Stall;
import com.cibf.entity.Stall.StallSize;
import com.cibf.entity.Stall.StallStatus;
import com.cibf.exception.ResourceNotFoundException;
import com.cibf.exception.DuplicateResourceException;
import com.cibf.repository.StallRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StallService {

    private final StallRepository stallRepository;

    /**
     * Create a new stall
     */
    @Transactional
    public StallResponseDTO createStall(StallRequestDTO requestDTO) {
        log.info("Creating new stall: {}", requestDTO.getStallName());

        // Check if stall name already exists
        if (stallRepository.existsByStallName(requestDTO.getStallName())) {
            throw new DuplicateResourceException("Stall with name '" + requestDTO.getStallName() + "' already exists");
        }

        Stall stall = new Stall();
        stall.setStallName(requestDTO.getStallName());
        stall.setSize(requestDTO.getSize());
        stall.setDimension(requestDTO.getDimension());
        stall.setLocationX(requestDTO.getLocationX());
        stall.setLocationY(requestDTO.getLocationY());
        stall.setPrice(requestDTO.getPrice());
        stall.setStatus(requestDTO.getStatus() != null ? requestDTO.getStatus() : StallStatus.AVAILABLE);
        stall.setCreatedByEmployee(resolveCurrentEmployee());

        Stall savedStall = stallRepository.save(stall);
        log.info("Stall created successfully with ID: {}", savedStall.getId());

        return new StallResponseDTO(savedStall);
    }

    /**
     * Get all stalls
     */
    @Transactional(readOnly = true)
    public List<StallResponseDTO> getAllStalls() {
        log.info("Fetching all stalls");
        return stallRepository.findAllByOrderByStallNameAsc()
                .stream()
                .map(StallResponseDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get stall by ID
     */
    @Transactional(readOnly = true)
    public StallResponseDTO getStallById(Long id) {
        log.info("Fetching stall by ID: {}", id);
        Stall stall = stallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stall not found with ID: " + id));
        return new StallResponseDTO(stall);
    }

    /**
     * Get available stalls only
     */
    @Transactional(readOnly = true)
    public List<StallResponseDTO> getAvailableStalls() {
        log.info("Fetching available stalls");
        return stallRepository.findByStatusOrderByStallNameAsc(StallStatus.AVAILABLE)
                .stream()
                .map(StallResponseDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get stalls for map display (simplified data)
     */
    @Transactional(readOnly = true)
    public List<StallMapDTO> getStallsForMap() {
        log.info("Fetching stalls for map display");
        return stallRepository.findAllByOrderByStallNameAsc()
                .stream()
                .map(StallMapDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get stalls by size
     */
    @Transactional(readOnly = true)
    public List<StallResponseDTO> getStallsBySize(StallSize size) {
        log.info("Fetching stalls by size: {}", size);
        return stallRepository.findBySize(size)
                .stream()
                .map(StallResponseDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get available stalls by size
     */
    @Transactional(readOnly = true)
    public List<StallResponseDTO> getAvailableStallsBySize(StallSize size) {
        log.info("Fetching available stalls by size: {}", size);
        return stallRepository.findBySizeAndStatus(size, StallStatus.AVAILABLE)
                .stream()
                .map(StallResponseDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Update stall status
     */
    @Transactional
    public StallResponseDTO updateStallStatus(Long stallId, StallStatus status) {
        log.info("Updating stall status for ID: {} to {}", stallId, status);

        Stall stall = stallRepository.findById(stallId)
                .orElseThrow(() -> new ResourceNotFoundException("Stall not found with ID: " + stallId));

        stall.setStatus(status);
        Stall updatedStall = stallRepository.save(stall);

        log.info("Stall status updated successfully");
        return new StallResponseDTO(updatedStall);
    }

    /**
     * Update stall details
     */
    @Transactional
    public StallResponseDTO updateStall(Long stallId, StallRequestDTO requestDTO) {
        log.info("Updating stall with ID: {}", stallId);

        Stall stall = stallRepository.findById(stallId)
                .orElseThrow(() -> new ResourceNotFoundException("Stall not found with ID: " + stallId));

        // Check if new stall name already exists (if changed)
        if (!stall.getStallName().equals(requestDTO.getStallName()) &&
                stallRepository.existsByStallName(requestDTO.getStallName())) {
            throw new DuplicateResourceException("Stall with name '" + requestDTO.getStallName() + "' already exists");
        }

        stall.setStallName(requestDTO.getStallName());
        stall.setSize(requestDTO.getSize());
        stall.setDimension(requestDTO.getDimension());
        stall.setLocationX(requestDTO.getLocationX());
        stall.setLocationY(requestDTO.getLocationY());
        stall.setPrice(requestDTO.getPrice());
        if (requestDTO.getStatus() != null) {
            stall.setStatus(requestDTO.getStatus());
        }

        Stall updatedStall = stallRepository.save(stall);
        log.info("Stall updated successfully");

        return new StallResponseDTO(updatedStall);
    }

    /**
     * Delete stall
     */
    @Transactional
    public void deleteStall(Long stallId) {
        log.info("Deleting stall with ID: {}", stallId);

        if (!stallRepository.existsById(stallId)) {
            throw new ResourceNotFoundException("Stall not found with ID: " + stallId);
        }

        stallRepository.deleteById(stallId);
        log.info("Stall deleted successfully");
    }

    /**
     * Check if stall is available
     */
    @Transactional(readOnly = true)
    public boolean isStallAvailable(Long stallId) {
        Stall stall = stallRepository.findById(stallId)
                .orElseThrow(() -> new ResourceNotFoundException("Stall not found with ID: " + stallId));
        return stall.getStatus() == StallStatus.AVAILABLE;
    }

    /**
     * Check if multiple stalls are available
     */
    @Transactional(readOnly = true)
    public boolean areStallsAvailable(List<Long> stallIds) {
        for (Long stallId : stallIds) {
            if (!isStallAvailable(stallId)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get stall statistics for dashboard
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStallStatistics() {
        log.info("Fetching stall statistics");

        long totalStalls = stallRepository.count();
        long availableStalls = stallRepository.countByStatus(StallStatus.AVAILABLE);
        long reservedStalls = stallRepository.countByStatus(StallStatus.RESERVED);

        long smallAvailable = stallRepository.countBySizeAndStatus(StallSize.SMALL, StallStatus.AVAILABLE);
        long mediumAvailable = stallRepository.countBySizeAndStatus(StallSize.MEDIUM, StallStatus.AVAILABLE);
        long largeAvailable = stallRepository.countBySizeAndStatus(StallSize.LARGE, StallStatus.AVAILABLE);

        return Map.of(
                "totalStalls", totalStalls,
                "availableStalls", availableStalls,
                "reservedStalls", reservedStalls,
                "unavailableStalls", totalStalls - availableStalls - reservedStalls,
                "availableBySize", Map.of(
                        "SMALL", smallAvailable,
                        "MEDIUM", mediumAvailable,
                        "LARGE", largeAvailable
                )
        );
    }

    private String resolveCurrentEmployee() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return "UNKNOWN";
        }
        return authentication.getName();
    }
}
