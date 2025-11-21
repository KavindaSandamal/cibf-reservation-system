package com.cibf;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

<<<<<<< HEAD
@SpringBootApplication(scanBasePackages = "com.cibf") // ensures all repos are scanned
=======
@SpringBootApplication
@ComponentScan(basePackages = "com.cibf") // Scan all components
@EnableJpaRepositories(basePackages = "com.cibf.repository") // Scan repositories
@EntityScan(basePackages = "com.cibf.entity") // Scan entities
>>>>>>> aaa423defe29c765dc2fef11b079324424191c5a
public class StallServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(StallServiceApplication.class, args);
    }
}
