package com.cibf.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Main configuration for Spring Security (Secured Endpoints).
 * This chain runs after the PublicSecurityConfig (Order 1) and handles all
 * authenticated routes.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enables @PreAuthorize annotations
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    public SecurityConfig(JwtAuthenticationEntryPoint authenticationEntryPoint) {
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtTokenProvider tokenProvider,
            CustomUserDetailsService userDetailsService) {
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
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://34.213.51.153",
                "http://34.213.51.153:*",
                "https://34.213.51.153",
                "https://34.213.51.153:*"));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain applicationSecurityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter authenticationFilter) throws Exception {

        http
                // 1. Apply CORS configuration
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 2. CSRF disabled for JWT-based API
                .csrf(AbstractHttpConfigurer::disable)

                // 3. Disable basic auth and form login
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)

                // 4. Handle authentication exceptions
                .exceptionHandling(exception -> exception.authenticationEntryPoint(authenticationEntryPoint))

                // 5. Enforce stateless session policy (KEY for JWT)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 6. Only apply this security chain to non-public paths
                .securityMatcher("/api/**")
                .authorizeHttpRequests(authorize -> authorize
                        // Public endpoints - no authentication required
                        .requestMatchers("/api/auth/**", "/api/public/**").permitAll()

                        // Admin endpoints - let @PreAuthorize handle fine-grained control
                        // Just require authentication here
                        .requestMatchers("/api/admin/**").authenticated()

                        // Any other request must be authenticated
                        .anyRequest().authenticated());

        // 7. Add JWT filter BEFORE Spring Security's authentication filter
        http.addFilterBefore(authenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}