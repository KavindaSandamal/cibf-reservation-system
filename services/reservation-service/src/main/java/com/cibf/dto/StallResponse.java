package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StallResponse {

    private Long id;
    private String stallName;
    private String size;
    private String dimensions;
    private BigDecimal price;
    private String status;
    private boolean available;
    private String description;
    private String location;
}