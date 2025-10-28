package com.cibf.reservation.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the CIBF Reservation System Backend application.
 * This class uses the @SpringBootApplication annotation, which is a convenience
 * annotation that adds:
 * - @Configuration: Tags the class as a source of bean definitions for the
 * application context.
 * - @EnableAutoConfiguration: Tells Spring Boot to start adding beans based on
 * classpath settings.
 * - @ComponentScan: Tells Spring to look for other components, configurations,
 * and services
 * in the com.cibf.reservation.backend package and its sub-packages.
 */
@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}
