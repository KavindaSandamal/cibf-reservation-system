package com.cibf.repository;

import com.cibf.entity.StallHold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StallHoldRepository extends JpaRepository<StallHold, Long> {

    Optional<StallHold> findByHoldToken(String holdToken);

    List<StallHold> findByUserIdAndUsedFalseAndExpiresAtAfter(Long userId, LocalDateTime now);

    List<StallHold> findByExpiresAtBeforeAndUsedFalse(LocalDateTime now);
}
