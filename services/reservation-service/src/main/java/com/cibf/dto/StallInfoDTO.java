package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StallInfoDTO {
    private Long id;
    private String stallName;
    private String size;
    private String dimensions;
    private BigDecimal price;
}
