package com.cibf.repository;

import com.cibf.entity.LiteraryGenre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LiteraryGenreRepository extends JpaRepository<LiteraryGenre, Long> {
    
    /**
     * Find genre by name (case-insensitive).
     */
    Optional<LiteraryGenre> findByGenreNameIgnoreCase(String genreName);
    
    /**
     * Check if genre exists by name.
     */
    boolean existsByGenreNameIgnoreCase(String genreName);
}