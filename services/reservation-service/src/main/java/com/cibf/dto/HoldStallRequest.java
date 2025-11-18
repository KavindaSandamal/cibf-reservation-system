package com.cibf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HoldStallRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Stall IDs are required")
    @Size(min = 1, max = 3, message = "Must select 1-3 stalls")
    private List<Long> stallIds;

    @NotNull(message = "Business name is required")
    private String businessName;
}