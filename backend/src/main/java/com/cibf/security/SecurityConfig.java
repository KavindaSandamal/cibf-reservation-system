package com.cibf.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Main configuration for Spring Security.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    // Constructor for dependency injection of EntryPoint
    public SecurityConfig(JwtAuthenticationEntryPoint authenticationEntryPoint) {
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    // --- CRITICAL FIX 1: Define the Filter as a Bean ---
    // This allows Spring to instantiate it correctly and inject its dependencies
    // (tokenProvider, userDetailsService).
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtTokenProvider tokenProvider,
            CustomUserDetailsService userDetailsService) {
        // Spring handles the injection of tokenProvider and userDetailsService here.
        return new JwtAuthenticationFilter(tokenProvider, userDetailsService);
    }

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    // --- CRITICAL FIX 2: Inject the JwtAuthenticationFilter into this method ---
    // Spring will automatically provide the bean we defined in CRITICAL FIX 1.
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter authenticationFilter)
            throws Exception {
        http.csrf(csrf -> csrf.disable())
                // Disable default authentication mechanisms
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())

                // Set exception handling for unauthenticated requests
                .exceptionHandling(exception -> exception.authenticationEntryPoint(authenticationEntryPoint))

                // Set session management to stateless, mandatory for JWT
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Configure authorization rules
                .authorizeHttpRequests(authorize -> authorize
                        // Permit all access to auth endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        // All other requests must be authenticated
                        .anyRequest().authenticated());

        // --- CRITICAL FIX 3: Use the injected bean instance directly ---
        // This ensures Spring correctly manages the filter and places it in the chain.
        http.addFilterBefore(authenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
