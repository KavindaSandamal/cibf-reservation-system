package com.cibf.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Represents a literary genre (e.g., Fiction, Non-Fiction, Biography).
 * Follows Single Responsibility Principle - represents genre data only.
 */
@Entity
@Table(name = "literary_genres")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LiteraryGenre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String genreName;

    @Column(length = 500)
    private String description;

    public LiteraryGenre(String genreName, String description) {
        this.genreName = genreName;
        this.description = description;
    }
}