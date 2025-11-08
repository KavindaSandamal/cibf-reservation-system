package com.cibf.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Data Transfer Object for Literary Genre.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenreDTO {
    private Long id;
    private String genreName;
    private String description;
}
