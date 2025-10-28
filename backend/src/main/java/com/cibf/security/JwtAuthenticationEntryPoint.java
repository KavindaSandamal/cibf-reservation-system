package com.cibf.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Custom entry point to handle authentication exceptions (e.g., trying to
 * access a protected
 * resource without a token, or with an invalid token). It sends a 401
 * Unauthorized response.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {

        // This method is called whenever an exception is thrown trying to access an
        // authenticated resource. It simply sends a 401 Unauthorized response.
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Access Denied / Unauthenticated");
    }
}
