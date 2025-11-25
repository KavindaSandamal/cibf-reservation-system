package com.cibf.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JWT Authentication Filter
 * Intercepts every request and validates JWT token if present.
 * Extracts roles from token and sets authentication with proper authorities.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
            CustomUserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        logger.debug("Processing request: {} {}", request.getMethod(), requestURI);

        try {
            // Extract JWT token from Authorization header
            String token = getTokenFromRequest(request);

            // Only validate and authenticate if token is present
            if (StringUtils.hasText(token)) {
                logger.debug("Token found in request for URI: {}", requestURI);

                // Validate token
                if (tokenProvider.validateToken(token)) {
                    logger.debug("Token is valid");

                    // Get username from token
                    String username = tokenProvider.getUsername(token);
                    logger.debug("Username from token: {}", username);

                    // Extract roles from token
                    String rolesString = tokenProvider.getRoles(token);
                    logger.debug("Roles from token: {}", rolesString);

                    // Create authorities list
                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();

                    if (StringUtils.hasText(rolesString)) {
                        authorities = Arrays.stream(rolesString.split(","))
                                .map(String::trim)
                                .filter(StringUtils::hasText)
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());

                        logger.info("Authorities extracted from token: {}", authorities);

                        // Log the actual authority strings for debugging
                        logger.info("Authority strings: {}",
                                authorities.stream()
                                        .map(SimpleGrantedAuthority::getAuthority)
                                        .collect(Collectors.joining(", ")));
                    } else {
                        // If no roles in token, try to load from UserDetails as fallback
                        logger.warn("No roles found in token, loading from UserDetails");
                        try {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            authorities = userDetails.getAuthorities().stream()
                                    .map(auth -> new SimpleGrantedAuthority(auth.getAuthority()))
                                    .collect(Collectors.toList());
                            logger.debug("Authorities loaded from UserDetails: {}", authorities);
                        } catch (Exception e) {
                            logger.error("Failed to load user details for username: {}", username, e);
                        }
                    }

                    // Only set authentication if we have authorities
                    if (!authorities.isEmpty()) {
                        // Load user details for additional information
                        UserDetails userDetails = null;
                        try {
                            userDetails = userDetailsService.loadUserByUsername(username);
                            logger.debug("User details loaded for: {}", username);
                        } catch (Exception e) {
                            logger.warn("Could not load user details for {}, using username only", username);
                        }

                        // Create authentication object
                        Object principal = userDetails != null ? userDetails : username;

                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                authorities);

                        authentication.setDetails(
                                new WebAuthenticationDetailsSource().buildDetails(request));

                        // Set authentication in Security Context
                        SecurityContextHolder.getContext().setAuthentication(authentication);

                        logger.info("Successfully authenticated user: {} with authorities: {}",
                                username, authorities);
                    } else {
                        logger.warn("No authorities found for user: {}, authentication not set", username);
                    }

                } else {
                    logger.warn("Invalid JWT token for URI: {}", requestURI);
                }
            } else {
                logger.debug("No JWT token found for URI: {} - continuing as unauthenticated", requestURI);
            }

        } catch (Exception ex) {
            // Log error with full stack trace
            logger.error("Cannot set user authentication in security context for URI: {}", requestURI, ex);
            // Clear any partial authentication
            SecurityContextHolder.clearContext();
        }

        // Always continue the filter chain
        // This allows public endpoints (/api/auth/**) to work without authentication
        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token from Authorization header.
     * Expected format: "Bearer <token>"
     * 
     * @param request HTTP request
     * @return JWT token string or null if not present
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            logger.debug("Extracted token from Authorization header (length: {})", token.length());
            return token;
        }

        logger.debug("No Bearer token found in Authorization header");
        return null;
    }
}