package com.cibf.security;

import com.cibf.entity.User;
import com.cibf.entity.Role;
import com.cibf.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Set;

/**
 * Loads user-specific data during authentication from the database.
 * Follows:
 * - Single Responsibility Principle (SRP): Handles user data loading only
 * - Encapsulation: Hides user-to-SecurityUser conversion logic
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // Use Role enum for type safety and get authority
        Role userRole = user.getRoleEnum();
        Set<GrantedAuthority> authorities = Set.of(
                new SimpleGrantedAuthority(userRole.getAuthority())
        );

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities);
    }
}