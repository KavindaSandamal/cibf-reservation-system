package com.cibf.repository;

import com.cibf.entity.UserGenre;
import com.cibf.entity.User;
import com.cibf.entity.LiteraryGenre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserGenreRepository extends JpaRepository<UserGenre, Long> {
    
    /**
     * Find all genres selected by a user.
     */
    List<UserGenre> findByUserId(Long userId);
    
    /**
     * Find all users who selected a specific genre.
     */
    List<UserGenre> findByGenreId(Long genreId);
    
    /**
     * Check if user has already selected a genre.
     */
    boolean existsByUserIdAndGenreId(Long userId, Long genreId);
    
    /**
     * Delete all genres for a user.
     */
    void deleteByUserId(Long userId);
    
    /**
     * Delete specific genre for a user.
     */
    void deleteByUserIdAndGenreId(Long userId, Long genreId);
    
    /**
     * Find specific user-genre relationship.
     */
    Optional<UserGenre> findByUserIdAndGenreId(Long userId, Long genreId);
    
    /**
     * Get genres with details for a user.
     */
    @Query("SELECT ug FROM UserGenre ug JOIN FETCH ug.genre WHERE ug.user.id = :userId")
    List<UserGenre> findByUserIdWithGenres(@Param("userId") Long userId);
}
