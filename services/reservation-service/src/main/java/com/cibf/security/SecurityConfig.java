package com.cibf.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.core.context.SecurityContextHolder;
import feign.RequestInterceptor;
import feign.RequestTemplate;



@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain reservationSecurity(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

   @Bean
public RequestInterceptor feignRequestInterceptor() {
    return template -> {
        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null) {
            System.out.println("🔍 AUTH in context: " + auth);
            System.out.println("🔑 Credentials: " + auth.getCredentials());
        }

        if (auth != null && auth.getCredentials() != null) {
            String token = auth.getCredentials().toString();
            System.out.println("🔥 Forwarding JWT to Feign: " + token);
            template.header("Authorization", "Bearer " + token);
        } else {
            System.out.println("❌ No token found — Feign is sending NO Authorization header!");
        }
    };
}

}