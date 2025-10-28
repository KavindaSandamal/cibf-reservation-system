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

    // NOTE: Removed the direct injection of JwtAuthenticationFilter from the
    // constructor
    // to use the @Bean method below, which is the standard practice.
    public SecurityConfig(JwtAuthenticationEntryPoint authenticationEntryPoint) {
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    // --- CRITICAL FIX 1: Define the Filter as a Bean ---
    // This allows Spring to instantiate it correctly and inject its dependencies.
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtTokenProvider tokenProvider,
            CustomUserDetailsService userDetailsService) {
        // Since JwtAuthenticationFilter had @Component, we can use constructor
        // injection here.
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
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
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

        // --- CRITICAL FIX 2: Use the Bean created above ---
        // Ensure the filter is added to the chain correctly.
        http.addFilterBefore(jwtAuthenticationFilter(null, null), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
