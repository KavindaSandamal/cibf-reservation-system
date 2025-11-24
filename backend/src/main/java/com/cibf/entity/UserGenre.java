package com.cibf.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Join table entity for Many-to-Many relationship between Users and Genres.
 * Represents user's selected literary genres.
 */
@Entity
@Table(name = "user_genres")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserGenre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "genre_id", nullable = false)
    private LiteraryGenre genre;

    public UserGenre(User user, LiteraryGenre genre) {
        this.user = user;
        this.genre = genre;
    }
}