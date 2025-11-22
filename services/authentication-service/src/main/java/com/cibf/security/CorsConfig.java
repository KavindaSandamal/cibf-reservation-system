package com.cibf.security;

import org.springframework.context.annotation.Configuration;

/**
 * CORS configuration is handled by SecurityConfig.corsConfigurationSource()
 * for all endpoints (both secured and public).
 * 
 * This class is kept for potential future use but is currently disabled
 * to avoid conflicts with Spring Security's CORS configuration.
 */
@Configuration
public class CorsConfig {
    // CORS is now handled entirely by SecurityConfig.corsConfigurationSource()
    // This prevents conflicts between WebMvcConfigurer CORS and Spring Security CORS
}
