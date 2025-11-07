package com.cibf.repository;

import com.cibf.entity.Stall;
import com.cibf.entity.Stall.StallSize;
import com.cibf.entity.Stall.StallStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StallRepository extends JpaRepository<Stall, Long> {
    
    // Find stall by name
    Optional<Stall> findByStallName(String stallName);
    
    // Check if stall name already exists
    boolean existsByStallName(String stallName);
    
    // Find all stalls by status
    List<Stall> findByStatus(StallStatus status);
    
    // Find all available stalls
    List<Stall> findByStatusOrderByStallNameAsc(StallStatus status);
    
    // Find stalls by size
    List<Stall> findBySize(StallSize size);
    
    // Find available stalls by size
    List<Stall> findBySizeAndStatus(StallSize size, StallStatus status);
    
    // Count stalls by status
    long countByStatus(StallStatus status);
    
    // Count available stalls by size
    @Query("SELECT COUNT(s) FROM Stall s WHERE s.size = :size AND s.status = :status")
    long countBySizeAndStatus(@Param("size") StallSize size, @Param("status") StallStatus status);
    
    // Get all stalls ordered by name
    List<Stall> findAllByOrderByStallNameAsc();
    
    // Find stalls within a location range (for map filtering)
    @Query("SELECT s FROM Stall s WHERE s.locationX BETWEEN :minX AND :maxX " +
           "AND s.locationY BETWEEN :minY AND :maxY")
    List<Stall> findStallsInLocationRange(
        @Param("minX") Double minX, 
        @Param("maxX") Double maxX,
        @Param("minY") Double minY, 
        @Param("maxY") Double maxY
    );
    
    // Get statistics for dashboard
    @Query("SELECT s.size, s.status, COUNT(s) FROM Stall s GROUP BY s.size, s.status")
    List<Object[]> getStallStatistics();
}
