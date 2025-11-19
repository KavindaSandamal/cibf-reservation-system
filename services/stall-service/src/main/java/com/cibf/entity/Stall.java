package com.cibf.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stalls")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Stall {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 10)
    private String stallName; // e.g., "A1", "B2", "C3"
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StallSize size;
    
    @Column(nullable = false, length = 50)
    private String dimension; // e.g., "10x10", "15x15", "20x20"
    
    @Column(nullable = false)
    private Double locationX; // X coordinate on the map
    
    @Column(nullable = false)
    private Double locationY; // Y coordinate on the map
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StallStatus status;

    @Column(name = "Created_by_employee", length = 100)
    private String CreatedByEmployee;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = StallStatus.AVAILABLE;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Enums
    public enum StallSize {
        SMALL, MEDIUM, LARGE
    }
    
    public enum StallStatus {
        AVAILABLE, RESERVED, UNAVAILABLE
    }
}