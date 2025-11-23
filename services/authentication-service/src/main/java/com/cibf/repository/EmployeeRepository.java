package com.cibf.repository;

import com.cibf.entity.Employee;
import com.cibf.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for Employee entity.
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /**
     * Find employee by employee ID (e.g., EMP-001)
     */
    Optional<Employee> findByEmployeeId(String employeeId);

    /**
     * Find employee by email
     */
    Optional<Employee> findByEmail(String email);

    /**
     * Check if employee ID exists
     */
    boolean existsByEmployeeId(String employeeId);

    Optional<Employee> findByUser(User user);
}