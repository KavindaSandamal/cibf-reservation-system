package com.cibf.config;

import feign.RequestInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

@Configuration
public class FeignClientConfig {

    private static final Logger log = LoggerFactory.getLogger(FeignClientConfig.class);

    /**
     * Creates a RequestInterceptor to propagate the current user's JWT
     */
    @Bean
    public RequestInterceptor jwtRequestInterceptor() {
        return requestTemplate -> {
            // Get the current user's authentication object from Spring Security Context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String token = null;

            if (authentication != null && authentication.isAuthenticated()) {

                try {
                    // 1. Attempt to cast the principal to a Jwt object (Standard OAuth2 Resource
                    // Server flow)
                    Jwt jwt = (Jwt) authentication.getPrincipal();
                    token = jwt.getTokenValue();
                    log.debug("Extracted token from Jwt principal.");

                } catch (ClassCastException e) {
                    // 2. Fallback: If the principal isn't a Jwt, check credentials for the raw
                    // String token
                    if (authentication.getCredentials() != null) {
                        token = authentication.getCredentials().toString();
                        log.debug("Extracted token from credentials fallback.");
                    } else {
                        log.warn("Cannot propagate token: Principal is not a Jwt, and credentials are null.");
                    }
                }

                if (token != null) {
                    requestTemplate.header("Authorization", "Bearer " + token);
                    log.debug("Successfully propagated JWT token in Authorization header for Feign call.");
                }

            } else {
                log.debug("No authenticated user context found for S2S call. Not adding JWT.");
            }
        };
    }
}