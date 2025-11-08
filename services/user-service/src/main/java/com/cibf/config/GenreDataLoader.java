package com.cibf.config;

import com.cibf.entity.LiteraryGenre;
import com.cibf.repository.LiteraryGenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Loads initial genre data into the database on application startup.
 * Only runs if genres table is empty.
 */
@Component
@RequiredArgsConstructor
public class GenreDataLoader implements CommandLineRunner {

    private final LiteraryGenreRepository genreRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only load if database is empty
        if (genreRepository.count() == 0) {
            loadGenres();
        }
    }

    private void loadGenres() {
        // Create initial genres
        genreRepository.save(new LiteraryGenre("Fiction", "Imaginative or invented stories"));
        genreRepository.save(new LiteraryGenre("Non-Fiction", "Factual and informative books"));
        genreRepository.save(new LiteraryGenre("Mystery", "Detective and crime fiction"));
        genreRepository.save(new LiteraryGenre("Romance", "Love stories and romantic fiction"));
        genreRepository.save(new LiteraryGenre("Science Fiction", "Futuristic and speculative fiction"));
        genreRepository.save(new LiteraryGenre("Fantasy", "Magical and mythological stories"));
        genreRepository.save(new LiteraryGenre("Biography", "Life stories of real people"));
        genreRepository.save(new LiteraryGenre("History", "Historical events and periods"));
        genreRepository.save(new LiteraryGenre("Self-Help", "Personal development and improvement"));
        genreRepository.save(new LiteraryGenre("Poetry", "Poetic works and collections"));
        genreRepository.save(new LiteraryGenre("Children's Books", "Books for young readers"));
        genreRepository.save(new LiteraryGenre("Young Adult", "Books for teenage readers"));
        genreRepository.save(new LiteraryGenre("Thriller", "Suspenseful and exciting stories"));
        genreRepository.save(new LiteraryGenre("Horror", "Scary and frightening fiction"));
        genreRepository.save(new LiteraryGenre("Classics", "Timeless literary works"));

        System.out.println("✅ Loaded 15 literary genres into database");
    }
}