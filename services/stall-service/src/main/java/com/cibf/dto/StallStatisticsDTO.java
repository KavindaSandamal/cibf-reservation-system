package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Stall Statistics (Employee Portal Dashboard)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StallStatisticsDTO {
    // Overall counts
    private Long totalStalls;
    private Long availableStalls;
    private Long reservedStalls;
    private Long unavailableStalls;

    // By size
    private Long smallStalls;
    private Long mediumStalls;
    private Long largeStalls;

    // Available by size
    private Long smallAvailable;
    private Long mediumAvailable;
    private Long largeAvailable;

    // Occupancy
    private Double occupancyRate; // Percentage
}