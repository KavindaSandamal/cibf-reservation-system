package com.cibf.service;

import com.cibf.dto.GenreDTO;
import com.cibf.dto.UserGenreRequest;
import com.cibf.entity.LiteraryGenre;
import com.cibf.entity.UserGenre;
import com.cibf.repository.LiteraryGenreRepository;
import com.cibf.repository.UserGenreRepository;
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
        return convertToDTO(genreRepository.save(genre));
    }

    @Transactional
    public GenreDTO updateGenre(Long id, GenreDTO genreDTO) {
        LiteraryGenre genre = genreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Genre not found with id: " + id));
        genre.setGenreName(genreDTO.getGenreName());
        genre.setDescription(genreDTO.getDescription());
        return convertToDTO(genreRepository.save(genre));
    }

    @Transactional
    public void deleteGenre(Long id) {
        if (!genreRepository.existsById(id)) {
            throw new RuntimeException("Genre not found with id: " + id);
        }
        genreRepository.deleteById(id);
    }

    // ----------------- USER GENRES BY USERNAME -----------------

    public List<GenreDTO> getUserGenresByUsername(String username) {
        List<UserGenre> userGenres = userGenreRepository.findByUsername(username);
        return userGenres.stream()
                .map(ug -> convertToDTO(ug.getGenre()))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<GenreDTO> updateUserGenresByUsername(String username, UserGenreRequest request) {
        userGenreRepository.deleteByUsername(username);

        List<UserGenre> newUserGenres = request.getGenreIds().stream()
                .map(genreId -> {
                    LiteraryGenre genre = genreRepository.findById(genreId)
                            .orElseThrow(() -> new RuntimeException("Genre not found with id: " + genreId));
                    return new UserGenre(username, genre); // username instead of userId
                })
                .collect(Collectors.toList());

        userGenreRepository.saveAll(newUserGenres);
        return getUserGenresByUsername(username);
    }

    @Transactional
    public GenreDTO addGenreToUserByUsername(String username, Long genreId) {
        LiteraryGenre genre = genreRepository.findById(genreId)
                .orElseThrow(() -> new RuntimeException("Genre not found with id: " + genreId));

        if (userGenreRepository.existsByUsernameAndGenreId(username, genreId)) {
            throw new RuntimeException("User already selected this genre");
        }

        userGenreRepository.save(new UserGenre(username, genre));
        return convertToDTO(genre);
    }

    @Transactional
    public void removeGenreFromUserByUsername(String username, Long genreId) {
        if (!userGenreRepository.existsByUsernameAndGenreId(username, genreId)) {
            throw new RuntimeException("Genre not selected by user");
        }
        userGenreRepository.deleteByUsernameAndGenreId(username, genreId);
    }

    private GenreDTO convertToDTO(LiteraryGenre genre) {
        return new GenreDTO(genre.getId(), genre.getGenreName(), genre.getDescription());
    }
}
