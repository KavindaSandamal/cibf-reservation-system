package com.cibf.reservation.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "Authentication-service", url = "http://localhost:8081/api/auth")
public interface UserServiceClient {

    @GetMapping("/{userId}/exists")
    boolean userExists(@PathVariable("userId") Long userId);
}
