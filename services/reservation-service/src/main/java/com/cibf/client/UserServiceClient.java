package com.cibf.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "Authentication-service", url = "http://authentication-service/api/auth")
public interface UserServiceClient {

    @GetMapping("/{userId}/exists")
    boolean userExists(@PathVariable("userId") Long userId);
}
