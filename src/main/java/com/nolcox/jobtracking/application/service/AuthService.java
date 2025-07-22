package com.nolcox.jobtracking.application.service;

import com.nolcox.jobtracking.application.dto.request.AuthRequest;
import com.nolcox.jobtracking.application.dto.request.RegisterRequest;
import com.nolcox.jobtracking.application.dto.response.AuthResponse;

public interface AuthService {
    /**
     * Register a new user in the system
     *
     * @param request Registration request containing user details
     * @return AuthResponse with JWT token and user information
     */
    AuthResponse register(RegisterRequest request);

    /**
     * Authenticate an existing user
     *
     * @param request Authentication request containing credentials
     * @return AuthResponse with JWT token and user information
     */
    AuthResponse authenticate(AuthRequest request);

    /**
     * Refresh JWT token
     *
     * @param refreshToken The refresh token
     * @return AuthResponse with new JWT token
     */
    AuthResponse refreshToken(String refreshToken);

    /**
     * Logout user (if implementing token blacklisting)
     *
     * @param token The JWT token to invalidate
     */
    void logout(String token);
}
