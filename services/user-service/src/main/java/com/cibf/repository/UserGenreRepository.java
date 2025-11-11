package com.cibf.repository;

import com.cibf.entity.UserGenre;
import com.cibf.entity.LiteraryGenre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserGenreRepository extends JpaRepository<UserGenre, Long> {

    List<UserGenre> findByUsername(String username);

    void deleteByUsername(String username);

    boolean existsByUsernameAndGenreId(String username, Long genreId);

    void deleteByUsernameAndGenreId(String username, Long genreId);
}
