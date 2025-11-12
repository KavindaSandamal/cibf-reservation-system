package com.cibf.reservation.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LockService {
    private final ConcurrentHashMap<String, String> locks = new ConcurrentHashMap<>();

    public boolean acquireLock(String stallId, String userId, int minutes) {
        return locks.putIfAbsent(stallId, userId) == null;
    }

    public void releaseLock(String stallId) {
        locks.remove(stallId);
    }
}
