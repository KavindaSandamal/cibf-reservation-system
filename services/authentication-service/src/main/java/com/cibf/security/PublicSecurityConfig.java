package com.cibf.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * High-priority configuration to handle public, unauthenticated, and
 * CSRF-disabled endpoints.
 * This runs first (Order 1) to ensure the CsrfFilter is bypassed for
 * /api/auth/**.
 */
@Configuration
@Order(1) //Ensures this chain is loaded and executed first
public class PublicSecurityConfig {

  
    //Defines a permissive filter chain for public endpoints.

    @Bean
    public SecurityFilterChain publicSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                // Explicitly disable CSRF using the static method
                .csrf(AbstractHttpConfigurer::disable)

                // Only match the public paths that need to be excluded from main
                // security
                .securityMatcher("/api/auth/**", "/api/public/**", "/swagger-ui/**", "/v3/api-docs/**")

                // Allow all requests matching the securityMatcher
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll())

                // Disable default form/basic login for these routes
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }
}