package com.cibf.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_genre")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserGenre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username; // instead of userId

    @ManyToOne
    @JoinColumn(name = "genre_id")
    private LiteraryGenre genre;

    public UserGenre(String username, LiteraryGenre genre) {
        this.username = username;
        this.genre = genre;
    }
}