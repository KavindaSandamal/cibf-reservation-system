package com.cibf.security;

import com.cibf.entity.User;
import com.cibf.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("Loading user by username: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("User not found: {}", username);
                    return new UsernameNotFoundException("User not found: " + username);
                });

        log.info("User found: {}, Role: {}", user.getUsername(), user.getRole());

        // CRITICAL FIX: getRole() returns String, not Role enum
        Collection<GrantedAuthority> authorities = getAuthorities(user.getRole());

        log.info("User authorities: {}", authorities);

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }

    /**
     * CRITICAL FIX: Convert role string to GrantedAuthority with ROLE_ prefix
     */
    private Collection<GrantedAuthority> getAuthorities(String role) {
        if (role == null || role.isEmpty()) {
            log.warn("User has no role assigned");
            return Collections.emptyList();
        }

        // Ensure ROLE_ prefix
        String authorityName = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        log.debug("Converting role '{}' to authority '{}'", role, authorityName);

        return Collections.singletonList(new SimpleGrantedAuthority(authorityName));
    }
}