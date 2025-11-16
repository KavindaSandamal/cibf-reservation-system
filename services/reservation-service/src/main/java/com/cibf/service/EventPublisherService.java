package com.cibf.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.time.LocalDateTime;

@Service
public class EventPublisherService {

    public void publishReservationHeld(Long userId, List<Long> stallIds, String holdToken, LocalDateTime expiresAt) {
        System.out.println("Event: Reservation held for user " + userId + " with stalls " + stallIds);
    }

    public void publishReservationConfirmed(Long userId, List<?> reservations) {
        System.out.println("Event: Reservation confirmed for user " + userId);
    }

    public void publishReservationCancelled(Long reservationId, Long userId, Long stallId) {
        System.out.println("Event: Reservation " + reservationId + " cancelled by user " + userId + " for stall " + stallId);
    }
}
