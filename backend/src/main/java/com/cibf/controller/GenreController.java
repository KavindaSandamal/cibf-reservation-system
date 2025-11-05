package com.cibf.controller;

import com.cibf.dto.GenreDTO;
import com.cibf.dto.UserGenreRequest;
import com.cibf.entity.User;
import com.cibf.repository.UserRepository;
import com.cibf.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class GenreController {

    private final GenreService genreService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<GenreDTO>> getAllGenres() {
        List<GenreDTO> genres = genreService.getAllGenres();
        return ResponseEntity.ok(genres);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GenreDTO> getGenreById(@PathVariable Long id) {
        GenreDTO genre = genreService.getGenreById(id);
        return ResponseEntity.ok(genre);
    }

    @PostMapping
    public ResponseEntity<GenreDTO> createGenre(@RequestBody GenreDTO genreDTO) {
        GenreDTO createdGenre = genreService.createGenre(genreDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdGenre);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GenreDTO> updateGenre(
            @PathVariable Long id,
            @RequestBody GenreDTO genreDTO) {
        GenreDTO updatedGenre = genreService.updateGenre(id, genreDTO);
        return ResponseEntity.ok(updatedGenre);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGenre(@PathVariable Long id) {
        genreService.deleteGenre(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user")
    public ResponseEntity<List<GenreDTO>> getUserGenres(Authentication authentication) {
        Long userId = extractUserIdFromAuthentication(authentication);
        System.out.println("🔍 GET /api/genres/user - User ID: " + userId);
        
        List<GenreDTO> userGenres = genreService.getUserGenres(userId);
        System.out.println("🔍 Returning " + userGenres.size() + " genres for user " + userId);
        
        return ResponseEntity.ok(userGenres);
    }

    @PostMapping("/user")
    public ResponseEntity<List<GenreDTO>> updateUserGenres(
            @RequestBody UserGenreRequest request,
            Authentication authentication) {
        Long userId = extractUserIdFromAuthentication(authentication);
        
        System.out.println("🔍 POST /api/genres/user - User ID: " + userId);
        System.out.println("🔍 Genre IDs to save: " + request.getGenreIds());
        
        List<GenreDTO> updatedGenres = genreService.updateUserGenres(userId, request);
        return ResponseEntity.ok(updatedGenres);
    }

    @PostMapping("/user/{genreId}")
    public ResponseEntity<GenreDTO> addGenreToUser(
            @PathVariable Long genreId,
            Authentication authentication) {
        Long userId = extractUserIdFromAuthentication(authentication);
        GenreDTO addedGenre = genreService.addGenreToUser(userId, genreId);
        return ResponseEntity.status(HttpStatus.CREATED).body(addedGenre);
    }

    @DeleteMapping("/user/{genreId}")
    public ResponseEntity<Void> removeGenreFromUser(
            @PathVariable Long genreId,
            Authentication authentication) {
        Long userId = extractUserIdFromAuthentication(authentication);
        genreService.removeGenreFromUser(userId, genreId);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            System.out.println("❌ User not authenticated!");
            throw new RuntimeException("User not authenticated");
        }

        try {
            String username;
            
            if (authentication.getPrincipal() instanceof UserDetails) {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                username = userDetails.getUsername();
            } else {
                username = authentication.getName();
            }

            System.out.println("🔍 Extracted username: " + username);

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found: " + username));

            System.out.println("🔍 Found user ID: " + user.getId() + " (username: " + username + ")");

            return user.getId();
            
        } catch (Exception e) {
            System.out.println("❌ Error extracting user: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to extract user information: " + e.getMessage());
        }
    }
}

