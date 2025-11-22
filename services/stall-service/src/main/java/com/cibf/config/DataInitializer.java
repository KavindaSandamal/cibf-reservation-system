package com.cibf.config;

import com.cibf.entity.Stall;
import com.cibf.repository.StallRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;

@Configuration
public class DataInitializer {
    
    @Bean
    CommandLineRunner initStalls(StallRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                // Small stalls
                repository.save(createStall("A1", Stall.StallSize.SMALL, "10x10", 10.0, 10.0, "5000.00", Stall.StallStatus.AVAILABLE));
                repository.save(createStall("A2", Stall.StallSize.SMALL, "10x10", 20.0, 10.0, "5000.00", Stall.StallStatus.AVAILABLE));
                repository.save(createStall("A3", Stall.StallSize.SMALL, "10x10", 30.0, 10.0, "5000.00", Stall.StallStatus.AVAILABLE));
                
                // Medium stalls
                repository.save(createStall("B1", Stall.StallSize.MEDIUM, "15x15", 10.0, 30.0, "8000.00", Stall.StallStatus.AVAILABLE));
                repository.save(createStall("B2", Stall.StallSize.MEDIUM, "15x15", 25.0, 30.0, "8000.00", Stall.StallStatus.RESERVED));
                repository.save(createStall("B3", Stall.StallSize.MEDIUM, "15x15", 40.0, 30.0, "8000.00", Stall.StallStatus.AVAILABLE));
                
                // Large stalls
                repository.save(createStall("C1", Stall.StallSize.LARGE, "20x20", 10.0, 50.0, "12000.00", Stall.StallStatus.AVAILABLE));
                repository.save(createStall("C2", Stall.StallSize.LARGE, "20x20", 30.0, 50.0, "12000.00", Stall.StallStatus.UNAVAILABLE));
                repository.save(createStall("C3", Stall.StallSize.LARGE, "20x20", 50.0, 50.0, "12000.00", Stall.StallStatus.AVAILABLE));
                
                System.out.println("Sample stall data initialized successfully!");
            }
        };
    }
    
    private Stall createStall(String name, Stall.StallSize size, String dimension, 
                             Double x, Double y, String price, Stall.StallStatus status) {
        Stall stall = new Stall();
        stall.setStallName(name);
        stall.setSize(size);
        stall.setDimension(dimension);
        stall.setLocationX(x);
        stall.setLocationY(y);
        stall.setPrice(new BigDecimal(price));
        stall.setStatus(status);
        return stall;
    }
}