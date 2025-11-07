package com.cibf.dto;

import com.cibf.entity.Stall;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StallMapDTO {

    private Long id;
    private String stallName;
    private Stall.StallSize size;
    private Double locationX;
    private Double locationY;
    private Stall.StallStatus status;

    public StallMapDTO(Stall stall) {
        this.id = stall.getId();
        this.stallName = stall.getStallName();
        this.size = stall.getSize();
        this.locationX = stall.getLocationX();
        this.locationY = stall.getLocationY();
        this.status = stall.getStatus();
    }
}