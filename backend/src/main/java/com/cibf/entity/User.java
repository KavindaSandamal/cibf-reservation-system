package com.cibf.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Represents a registered Book Publisher or Vendor in the system.
 * Follows Single Responsibility Principle - represents user data only.
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    /**
     * Business name for vendors/publishers.
     * Nullable for employees who don't have a business.
     */
    @Column(nullable = true)
    private String businessName;

    /**
     * User role stored as String in database for compatibility.
     * Use getRoleEnum() to get type-safe Role enum.
     */
    @Column(nullable = false)
    private String role;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Employee employee;

    public User(String username, String password, String businessName, String role) {
        this.username = username;
        this.password = password;
        this.businessName = businessName;
        this.role = role;
    }

    /**
     * Constructor using Role enum for type safety.
     * Follows Open/Closed Principle - easy to extend without modifying existing code.
     */
    public User(String username, String password, String businessName, Role role) {
        this.username = username;
        this.password = password;
        this.businessName = businessName;
        this.role = role != null ? role.getName() : Role.VENDOR.getName();
    }

    /**
     * Get role as enum for type-safe operations.
     * Returns VENDOR as default if role is invalid or null.
     */
    public Role getRoleEnum() {
        Role roleEnum = Role.fromString(this.role);
        return roleEnum != null ? roleEnum : Role.VENDOR;
    }

    /**
     * Set role using enum for type safety.
     */
    public void setRole(Role roleEnum) {
        this.role = roleEnum != null ? roleEnum.getName() : Role.VENDOR.getName();
    }

    /**
     * Check if user has a specific role.
     * Encapsulation - hides role comparison logic.
     */
    public boolean hasRole(Role roleToCheck) {
        return getRoleEnum() == roleToCheck;
    }

    /**
     * Check if user is an employee (EMPLOYEE or ADMIN).
     */
    public boolean isEmployee() {
        Role userRole = getRoleEnum();
        return userRole == Role.EMPLOYEE || userRole == Role.ADMIN;
    }

    /**
     * Check if user is a vendor.
     */
    public boolean isVendor() {
        return getRoleEnum() == Role.VENDOR;
    }
}