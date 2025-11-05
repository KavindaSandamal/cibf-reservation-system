package com.cibf.dto;

import com.cibf.entity.Stall;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StallRequestDTO {

    @NotBlank(message = "Stall name is required")
    @Size(max = 10, message = "Stall name must not exceed 10 characters")
    private String stallName;

    @NotNull(message = "Stall size is required")
    private Stall.StallSize size;

    @NotBlank(message = "Dimension is required")
    @Size(max = 50, message = "Dimension must not exceed 50 characters")
    private String dimension;

    @NotNull(message = "Location X is required")
    @DecimalMin(value = "0.0", message = "Location X must be non-negative")
    private Double locationX;

    @NotNull(message = "Location Y is required")
    @DecimalMin(value = "0.0", message = "Location Y must be non-negative")
    private Double locationY;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    private Stall.StallStatus status;
}