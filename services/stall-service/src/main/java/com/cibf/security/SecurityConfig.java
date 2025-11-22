package com.cibf.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        System.out.println("✓ SecurityConfig initialized with JwtAuthenticationFilter");
    }

    @Bean
    public SecurityFilterChain stallSecurity(HttpSecurity http) throws Exception {
        System.out.println("✓ Configuring SecurityFilterChain for Stall Service...");

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Allow OPTIONS requests (for CORS preflight)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public endpoints
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/public/**",
                                "/actuator/**",
                                "/error")
                        .permitAll()

                        // ⭐ Allow GET requests to stall endpoints (for service-to-service and public
                        // access)
                        .requestMatchers(HttpMethod.GET,
                                "/api/stalls", // Get all stalls
                                "/api/stalls/**") // Get stall by ID, by-ids, available, etc.
                        .permitAll()

                        // ⭐ Allow POST for status updates (service-to-service from
                        // reservation-service)
                        .requestMatchers(HttpMethod.POST,
                                "/api/stalls/*/status", // Pattern with wildcard
                                "/api/stalls/{id}/status") // Pattern with path variable
                        .permitAll()
                        .requestMatchers("/api/admin/**").hasAnyRole("EMPLOYEE", "ADMIN")

                        // All other requests require authentication
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        System.out.println("✓ SecurityFilterChain configured for Stall Service!");
        System.out.println("✓ Public GET access enabled for /api/stalls/**");
        System.out.println("✓ Public PATCH access enabled for /api/stalls/*/status");
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://34.209.143.5",
                "http://34.213.51.153",
                "http://34.213.51.153:3000"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
