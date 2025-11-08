package com.cibf.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

/**
 * Request DTO for updating user's genre preferences.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserGenreRequest {
    private List<Long> genreIds;
}

