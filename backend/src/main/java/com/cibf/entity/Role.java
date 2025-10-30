package com.cibf.entity;

/**
 * Enumeration of user roles in the CIBF Reservation System.
 * Follows the Type Safety principle - prevents magic strings and typos.
 * 
 * Roles:
 * - VENDOR: Book publishers/vendors who can reserve stalls
 * - EMPLOYEE: CIBF organizers who can view and manage reservations
 * - ADMIN: Administrative users with full system access
 */
public enum Role {
    VENDOR("VENDOR", "Book publisher or vendor who can reserve exhibition stalls"),
    EMPLOYEE("EMPLOYEE", "CIBF organizer who can view and manage reservations"),
    ADMIN("ADMIN", "Administrative user with full system access");

    private final String name;
    private final String description;

    Role(String name, String description) {
        this.name = name;
        this.description = description;
    }

    /**
     * Get the role name as string (for database storage)
     */
    public String getName() {
        return name;
    }

    /**
     * Get role description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Convert string to Role enum (case-insensitive)
     * 
     * @param roleName Role name as string
     * @return Role enum or null if not found
     */
    public static Role fromString(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return null;
        }
        
        for (Role role : Role.values()) {
            if (role.name.equalsIgnoreCase(roleName.trim())) {
                return role;
            }
        }
        return null;
    }

    /**
     * Get role name with ROLE_ prefix (for Spring Security authorities)
     */
    public String getAuthority() {
        return "ROLE_" + name;
    }
}

