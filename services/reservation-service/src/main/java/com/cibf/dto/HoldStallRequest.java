package com.cibf.reservation.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoldStallRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotEmpty(message = "Stall IDs cannot be empty")
    @Size(min = 1, max = 3, message = "You can hold between 1 and 3 stalls")
    private List<Long> stallIds;
}
