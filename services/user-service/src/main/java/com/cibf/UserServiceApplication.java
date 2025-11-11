package com.cibf.user_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = "com.cibf") // ✅ Scan all com.cibf packages
@EntityScan(basePackages = "com.cibf.entity") // ✅ Scan entities
@EnableJpaRepositories(basePackages = "com.cibf.repository") // ✅ Scan repositories
public class UserServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
