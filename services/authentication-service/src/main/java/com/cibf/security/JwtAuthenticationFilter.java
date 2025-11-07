package com.cibf.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT Authentication Filter
 * Intercepts every request and validates JWT token if present.
 * This filter should NOT block requests to public endpoints like
 * /api/auth/**
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

                    // Load user details
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    logger.debug("User details loaded for: {}", username);

                    // Create authentication object
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    // Set authentication in Security Context
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("Authentication set in SecurityContext for user: {}", username);

                } else {
                    logger.warn("Invalid JWT token for URI: {}", requestURI);
                }
            } else {
                logger.debug("No JWT token found for URI: {} - continuing as unauthenticated", requestURI);
            }

        } catch (Exception ex) {
            // Log error 
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

        return null;
    }
}