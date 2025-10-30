package com.cibf.reservation.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Main entry point for the CIBF Reservation System Backend application.
 */
@SpringBootApplication(scanBasePackages = {"com.cibf"})
@EntityScan(basePackages = {"com.cibf.entity"})
@EnableJpaRepositories(basePackages = {"com.cibf.repository"})
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}
