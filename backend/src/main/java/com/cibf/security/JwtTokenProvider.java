package com.cibf.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.security.Key;
import java.util.Date;

/**
 * Utility class for generating, validating, and extracting claims from JWTs.
 */
@Component
public class JwtTokenProvider {

    @Value("${app.jwt-secret}")
    private String jwtSecret;

    @Value("${app.jwt-expiration-milliseconds}")
    private long jwtExpirationDate;

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    // Generate JWT token
    public String generateToken(Authentication authentication) {
        String username = authentication.getName();

        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtExpirationDate);

        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority())
                .orElse("ROLE_UNKNOWN");

        // Uses the modern builder() pattern
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(currentDate)
                .setExpiration(expireDate)
                .signWith(key())
                .compact();
    }

    // Get username from JWT token
    public String getUsername(String token) {
        // Uses the modern parserBuilder() pattern, which is compatible with the 3 new
        // dependencies.
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key())
                .build() // IMPORTANT: The build() method is needed here!
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    // Validate JWT token
    public boolean validateToken(String token) {
        try {
            // Uses the modern parserBuilder() pattern.
            Jwts.parserBuilder()
                    .setSigningKey(key())
                    .build() // IMPORTANT: The build() method is needed here!
                    .parse(token);
            return true;
        } catch (MalformedJwtException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "JWT claims string is empty.");
        } catch (SignatureException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid JWT signature.");
        }
    }
}