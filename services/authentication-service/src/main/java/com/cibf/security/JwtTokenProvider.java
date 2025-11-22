package com.cibf.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.stream.Collectors;

/**
 * JWT Token Provider
 * Handles JWT token generation, validation, and extraction of claims
 * FIXED: Now includes roles in JWT tokens
 */
@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt-secret}")
    private String jwtSecret;

    @Value("${app.jwt-expiration-milliseconds}")
    private long jwtExpirationMs;

    /**
     * Generate JWT token from Authentication object
     * CRITICAL FIX: Now includes roles in the token
     */
    public String generateToken(Authentication authentication) {
        String username = authentication.getName();
        Date currentDate = new Date();
        Date expiryDate = new Date(currentDate.getTime() + jwtExpirationMs);

        // CRITICAL FIX: Extract roles from authentication authorities
        String roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        logger.debug("Generating token for user: {} with roles: {}", username, roles);

        String token = Jwts.builder()
                .setSubject(username)
                .claim("roles", roles) // Add roles to token claims
                .setIssuedAt(currentDate)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();

        logger.info("Generated JWT token for user: {} with roles: {}", username, roles);
        return token;
    }

    /**
     * Generate JWT token from username (for registration)
     * DEPRECATED: Use generateToken(Authentication) or generateToken(String,
     * String) instead
     */
    @Deprecated
    public String generateToken(String username) {
        Date currentDate = new Date();
        Date expiryDate = new Date(currentDate.getTime() + jwtExpirationMs);

        logger.warn("Generating token for username: {} WITHOUT roles - DEPRECATED METHOD", username);

        String token = Jwts.builder()
                .setSubject(username)
                .setIssuedAt(currentDate)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();

        return token;
    }

    /**
     * NEW: Generate JWT token from username and role
     * Use this for registration when you don't have Authentication object
     */
    public String generateToken(String username, String role) {
        Date currentDate = new Date();
        Date expiryDate = new Date(currentDate.getTime() + jwtExpirationMs);

        logger.debug("Generating token for username: {} with role: {}", username, role);

        String token = Jwts.builder()
                .setSubject(username)
                .claim("roles", role) // Add role to token claims
                .setIssuedAt(currentDate)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();

        logger.info("Generated JWT token for username: {} with role: {}", username, role);
        return token;
    }

    /**
     * Get username from JWT token
     */
    public String getUsername(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    /**
     * NEW: Get roles from JWT token
     * Returns the roles claim from the token
     */
    public String getRoles(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String roles = claims.get("roles", String.class);
            logger.debug("Extracted roles from token: {}", roles);
            return roles;
        } catch (Exception e) {
            logger.error("Error extracting roles from token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Validate JWT token
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);

            logger.debug("JWT token is valid");
            return true;

        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty: {}", ex.getMessage());
        } catch (Exception ex) {
            logger.error("JWT token validation error: {}", ex.getMessage());
        }

        return false;
    }

    /**
     * Get signing key from secret
     */
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}