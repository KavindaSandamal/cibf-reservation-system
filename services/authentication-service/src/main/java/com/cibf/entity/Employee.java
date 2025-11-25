package com.cibf.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Employee entity for storing employee-specific information
 * Linked to User entity (one-to-one relationship)
 */
@Entity
@Table(name = "employees", schema = "auth_schema", uniqueConstraints = {
        @UniqueConstraint(columnNames = "username"),
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "employee_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to User entity (one-to-one)
     */
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    /**
     * Username for login (unique)
     */
    @NotBlank(message = "Username is required")
    @Column(name = "username", nullable = false, unique = true)
    private String username;

    /**
     * Email address (unique)
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    /**
     * Encrypted password (if needed separately from User)
     */
    @Column(name = "password")
    private String password;

    /**
     * Full name of employee
     */
    @NotBlank(message = "Name is required")
    @Column(name = "name", nullable = false)
    private String name;

    /**
     * Employee ID (e.g., EMP-001)
     */
    @NotBlank(message = "Employee ID is required")
    @Column(name = "employee_id", nullable = false, unique = true)
    private String employeeId;

    /**
     * Role: EMPLOYEE or ADMIN
     */
    @NotBlank(message = "Role is required")
    @Column(name = "role", nullable = false)
    private String role;

    /**
     * Contact number
     */
    @Column(name = "contact_number")
    private String contactNumber;

    /**
     * Department
     */
    @Column(name = "department")
    private String department;

    /**
     * Account status
     */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    /**
     * Creation timestamp
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Last update timestamp
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Last login timestamp
     */
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    /**
     * Check if employee has ADMIN role
     */
    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
    }

    /**
     * Check if employee has EMPLOYEE role
     */
    public boolean isEmployee() {
        return "EMPLOYEE".equalsIgnoreCase(role) || "ROLE_EMPLOYEE".equalsIgnoreCase(role);
    }

    /**
     * Get role without ROLE_ prefix if present
     */
    public String getRoleWithoutPrefix() {
        if (role != null && role.startsWith("ROLE_")) {
            return role.substring(5);
        }
        return role;
    }

    /**
     * Get role with ROLE_ prefix
     */
    public String getRoleWithPrefix() {
        if (role != null && !role.startsWith("ROLE_")) {
            return "ROLE_" + role;
        }
        return role;
    }
}