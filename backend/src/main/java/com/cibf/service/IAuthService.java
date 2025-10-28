package com.cibf.service;

import com.cibf.dto.AuthRequest;
import com.cibf.dto.AuthResponse;
import com.cibf.dto.UserRegistrationRequest;

// IAuthService implements the Dependency Inversion Principle (DIP) and Interface Segregation Principle (ISP)
public interface IAuthService {

    AuthResponse registerUser(UserRegistrationRequest registrationRequest);

    AuthResponse authenticateUser(AuthRequest authRequest);
}