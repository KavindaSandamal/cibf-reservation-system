package com.cibf.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * User entity representing vendors/publishers and employees
 * Follows:
 * - Single Responsibility Principle: Represents user data only
 * - Encapsulation: Private fields with getters/setters
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "email")
    private String email; 

    @Column(name = "contact_number")
    private String contactNumber; 

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;  

    @Column(nullable = false)
    private String role;  // Store role as String in DB

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;  

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;  

    // Constructor for basic user creation
    public User(String username, String password, String businessName, Role role) {
        this.username = username;
        this.password = password;
        this.businessName = businessName;
        this.email = username; 
        this.role = role.getName();
    }

    // Full constructor for admin creation with all fields
    public User(String username, String password, String businessName, String email, 
                String contactNumber, String address, Role role) {
        this.username = username;
        this.password = password;
        this.businessName = businessName;
        this.email = email;
        this.contactNumber = contactNumber;
        this.address = address;
        this.role = role.getName();
    }

    /**
     * Get Role enum from string
     * Provides type-safe role access
     */
    public Role getRoleEnum() {
        return Role.fromString(this.role);
    }

    /**
     * Get Spring Security authority (ROLE_ prefix)
     */
    public String getAuthority() {
        return getRoleEnum().getAuthority();
    }

    /**
     * Check if user is an employee (EMPLOYEE or ADMIN role)
     */
    public boolean isEmployee() {
        Role userRole = getRoleEnum();
        return userRole == Role.EMPLOYEE || userRole == Role.ADMIN;
    }

    /**
     * Check if user is a vendor
     */
    public boolean isVendor() {
        return getRoleEnum() == Role.VENDOR;
    }
}