package com.cibf.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

@Configuration
public class FeignClientConfig {

    /**
     * Creates a RequestInterceptor to propagate the current user's JWT
     * to downstream microservices (like the stall-service).
     * This ensures the user's role and identity are maintained across service
     * calls.
     */
    @Bean
    public RequestInterceptor jwtRequestInterceptor() {
        return requestTemplate -> {
            // Get the current user's authentication object from Spring Security Context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated()) {
                // Assuming the principal is a JWT object after successful authentication
                // Note: The specific class might be Jwt or a custom UserDetails implementation
                // If you are using JwtDecoder, the principal is usually a Jwt.

                try {
                    // Attempt to cast the principal to a Jwt object
                    Jwt jwt = (Jwt) authentication.getPrincipal();

                    // Extract the raw token value (already signed)
                    String token = jwt.getTokenValue();

                    // Add the Authorization header for the downstream call
                    requestTemplate.header("Authorization", "Bearer " + token);

                } catch (ClassCastException e) {
                    // Handle case where the principal is not a Jwt (e.g., it's a String token or
                    // custom object)
                    // If you are using simple JWT processing without OAuth2/ResourceServer, you
                    // might need a different extraction logic.
                    // For example, if the token is stored as the credential:
                    // String token = (String) authentication.getCredentials();

                    System.err.println(
                            "Error propagating JWT: Principal is not a Spring Security Jwt object. Are you using OAuth2 Resource Server?");
                    // Optionally, log the exception or use a fallback mechanism
                }
            } else {
                System.out.println("No authenticated user context found for S2S call. Not adding JWT.");
            }
        };
    }
}