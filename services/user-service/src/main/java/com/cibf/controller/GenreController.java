package com.cibf.controller;

import com.cibf.dto.GenreDTO;
import com.cibf.dto.UserGenreRequest;
import com.cibf.security.JwtTokenProvider;
import com.cibf.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor

public class GenreController {

    private final GenreService genreService;
    private final JwtTokenProvider jwtTokenProvider;

    // ----------------- GENRES -----------------

    @GetMapping
    public ResponseEntity<List<GenreDTO>> getAllGenres() {
        return ResponseEntity.ok(genreService.getAllGenres());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GenreDTO> getGenreById(@PathVariable Long id) {
        return ResponseEntity.ok(genreService.getGenreById(id));
    }

    @PostMapping
    public ResponseEntity<GenreDTO> createGenre(@RequestBody GenreDTO genreDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(genreService.createGenre(genreDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GenreDTO> updateGenre(@PathVariable Long id,
                                                @RequestBody GenreDTO genreDTO) {
        return ResponseEntity.ok(genreService.updateGenre(id, genreDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGenre(@PathVariable Long id) {
        genreService.deleteGenre(id);
        return ResponseEntity.noContent().build();
    }

    // ----------------- USER GENRES BY USERNAME -----------------

    @GetMapping("/user")
    public ResponseEntity<List<GenreDTO>> getUserGenres(HttpServletRequest request) {
        String username = extractUsernameFromRequest(request);
        return ResponseEntity.ok(genreService.getUserGenresByUsername(username));
    }

    @PostMapping("/user")
    public ResponseEntity<List<GenreDTO>> updateUserGenres(@RequestBody UserGenreRequest requestBody,
                                                           HttpServletRequest request) {
        String username = extractUsernameFromRequest(request);
        return ResponseEntity.ok(genreService.updateUserGenresByUsername(username, requestBody));
    }

    @PostMapping("/user/{genreId}")
    public ResponseEntity<GenreDTO> addGenreToUser(@PathVariable Long genreId,
                                                   HttpServletRequest request) {
        String username = extractUsernameFromRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(genreService.addGenreToUserByUsername(username, genreId));
    }
    @PostMapping("/user/new")
    public ResponseEntity<GenreDTO> addNewGenreToUser(@RequestBody GenreDTO genreDTO,
                                                    HttpServletRequest request) {
        String username = extractUsernameFromRequest(request);

        // Step 1: Create the new genre
        GenreDTO newGenre = genreService.createGenre(genreDTO);

        // Step 2: Add it to the user
        GenreDTO addedGenre = genreService.addGenreToUserByUsername(username, newGenre.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(addedGenre);
    }


    @DeleteMapping("/user/{genreId}")
    public ResponseEntity<Void> removeGenreFromUser(@PathVariable Long genreId,
                                                    HttpServletRequest request) {
        String username = extractUsernameFromRequest(request);
        genreService.removeGenreFromUserByUsername(username, genreId);
        return ResponseEntity.noContent().build();
    }

    // ----------------- HELPER -----------------

    private String extractUsernameFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            throw new RuntimeException("Authorization header missing or invalid");
        }

        String token = bearerToken.substring(7);
        String username = jwtTokenProvider.getUsername(token);
        if (username == null || username.isBlank()) {
            throw new RuntimeException("Invalid JWT token: username not found");
        }
        return username;
    }
}
