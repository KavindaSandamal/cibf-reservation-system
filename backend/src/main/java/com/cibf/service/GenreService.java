package com.cibf.service;

import com.cibf.dto.GenreDTO;
import com.cibf.dto.UserGenreRequest;
import com.cibf.entity.LiteraryGenre;
import com.cibf.entity.User;
import com.cibf.entity.UserGenre;
import com.cibf.repository.LiteraryGenreRepository;
import com.cibf.repository.UserGenreRepository;
import com.cibf.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreService {

    private final LiteraryGenreRepository genreRepository;
    private final UserGenreRepository userGenreRepository;
    private final UserRepository userRepository;

    public List<GenreDTO> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public GenreDTO getGenreById(Long id) {
        LiteraryGenre genre = genreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Genre not found with id: " + id));
        return convertToDTO(genre);
    }

    @Transactional
    public GenreDTO createGenre(GenreDTO genreDTO) {
        if (genreRepository.existsByGenreNameIgnoreCase(genreDTO.getGenreName())) {
            throw new RuntimeException("Genre already exists: " + genreDTO.getGenreName());
        }

        LiteraryGenre genre = new LiteraryGenre();
        genre.setGenreName(genreDTO.getGenreName());
        genre.setDescription(genreDTO.getDescription());

        LiteraryGenre savedGenre = genreRepository.save(genre);
        return convertToDTO(savedGenre);
    }

    @Transactional
    public GenreDTO updateGenre(Long id, GenreDTO genreDTO) {
        LiteraryGenre genre = genreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Genre not found with id: " + id));

        genre.setGenreName(genreDTO.getGenreName());
        genre.setDescription(genreDTO.getDescription());

        LiteraryGenre updatedGenre = genreRepository.save(genre);
        return convertToDTO(updatedGenre);
    }

    @Transactional
    public void deleteGenre(Long id) {
        if (!genreRepository.existsById(id)) {
            throw new RuntimeException("Genre not found with id: " + id);
        }
        genreRepository.deleteById(id);
    }

    public List<GenreDTO> getUserGenres(Long userId) {
        System.out.println("🔍 Service: Fetching genres for user ID: " + userId);
        
        List<UserGenre> userGenres = userGenreRepository.findByUserIdWithGenres(userId);
        
        System.out.println("🔍 Service: Found " + userGenres.size() + " genres for user " + userId);
        
        return userGenres.stream()
                .map(ug -> convertToDTO(ug.getGenre()))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<GenreDTO> updateUserGenres(Long userId, UserGenreRequest request) {
        System.out.println("🔍 Service: Updating genres for user ID: " + userId);
        System.out.println("🔍 Service: New genre IDs: " + request.getGenreIds());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Delete all existing genres for THIS USER ONLY
        userGenreRepository.deleteByUserId(userId);
        System.out.println("🔍 Service: Deleted old genres for user " + userId);

        // Add new genre selections
        List<UserGenre> newUserGenres = request.getGenreIds().stream()
                .map(genreId -> {
                    LiteraryGenre genre = genreRepository.findById(genreId)
                            .orElseThrow(() -> new RuntimeException("Genre not found with id: " + genreId));
                    return new UserGenre(user, genre);
                })
                .collect(Collectors.toList());

        userGenreRepository.saveAll(newUserGenres);
        System.out.println("🔍 Service: Saved " + newUserGenres.size() + " new genres for user " + userId);

        return getUserGenres(userId);
    }

    @Transactional
    public GenreDTO addGenreToUser(Long userId, Long genreId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        LiteraryGenre genre = genreRepository.findById(genreId)
                .orElseThrow(() -> new RuntimeException("Genre not found with id: " + genreId));

        if (userGenreRepository.existsByUserIdAndGenreId(userId, genreId)) {
            throw new RuntimeException("User has already selected this genre");
        }

        UserGenre userGenre = new UserGenre(user, genre);
        userGenreRepository.save(userGenre);

        return convertToDTO(genre);
    }

    @Transactional
    public void removeGenreFromUser(Long userId, Long genreId) {
        if (!userGenreRepository.existsByUserIdAndGenreId(userId, genreId)) {
            throw new RuntimeException("User has not selected this genre");
        }
        userGenreRepository.deleteByUserIdAndGenreId(userId, genreId);
    }

    private GenreDTO convertToDTO(LiteraryGenre genre) {
        return new GenreDTO(
                genre.getId(),
                genre.getGenreName(),
                genre.getDescription()
        );
    }
}
