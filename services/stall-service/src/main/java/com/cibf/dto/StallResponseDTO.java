package com.cibf.dto;

import com.cibf.entity.Stall;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StallResponseDTO {

    private Long id;
    private String stallName;
    private Stall.StallSize size;
    private String dimension;
    private Double locationX;
    private Double locationY;
    private BigDecimal price;
    private Stall.StallStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructor from Entity
    public StallResponseDTO(Stall stall) {
        this.id = stall.getId();
        this.stallName = stall.getStallName();
        this.size = stall.getSize();
        this.dimension = stall.getDimension();
        this.locationX = stall.getLocationX();
        this.locationY = stall.getLocationY();
        this.price = stall.getPrice();
        this.status = stall.getStatus();
        this.createdAt = stall.getCreatedAt();
        this.updatedAt = stall.getUpdatedAt();
    }
}