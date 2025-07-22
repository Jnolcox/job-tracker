package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.request.AuthRequest;
import com.nolcox.jobtracking.application.dto.request.RegisterRequest;
import com.nolcox.jobtracking.application.dto.response.AuthResponse;
import com.nolcox.jobtracking.application.dto.response.UserInfo;
import com.nolcox.jobtracking.application.service.AuthService;
import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import com.nolcox.jobtracking.infrastructure.security.JwtService;
import com.nolcox.jobtracking.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse register(RegisterRequest request) {
        log.debug("Registering new user with email: {}", request.email());

        // Check if user already exists
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Email is already registered");
        }

        // Create new user
        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .enabled(true)
                .build();

        // Save user
        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        // Generate JWT token
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", savedUser.getId());
        extraClaims.put("role", savedUser.getRole().name());

        String jwtToken = jwtService.generateToken(extraClaims, savedUser);

        // Build response
        return buildAuthResponse(jwtToken, savedUser);
    }

    @Override
    public AuthResponse authenticate(AuthRequest request) {
        log.debug("Authenticating user with email: {}", request.email());

        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()
                    )
            );

            // Get authenticated user
            User user = (User) authentication.getPrincipal();

            // Generate JWT token
            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("userId", user.getId());
            extraClaims.put("role", user.getRole().name());

            String jwtToken = jwtService.generateToken(extraClaims, user);

            log.info("User authenticated successfully: {}", user.getEmail());

            // Build response
            return buildAuthResponse(jwtToken, user);

        } catch (BadCredentialsException e) {
            log.warn("Authentication failed for email: {}", request.email());
            throw new BusinessException("Invalid email or password");
        }
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        log.debug("Refreshing token");

        try {
            // Extract username from refresh token
            String username = jwtService.extractUsername(refreshToken);

            // Load user
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new BusinessException("User not found"));

            // Validate refresh token
            if (!jwtService.isTokenValid(refreshToken, user)) {
                throw new BusinessException("Invalid refresh token");
            }

            // Generate new access token
            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("userId", user.getId());
            extraClaims.put("role", user.getRole().name());

            String newAccessToken = jwtService.generateToken(extraClaims, user);

            log.info("Token refreshed successfully for user: {}", user.getEmail());

            return buildAuthResponse(newAccessToken, user);

        } catch (Exception e) {
            log.error("Error refreshing token", e);
            throw new BusinessException("Failed to refresh token");
        }
    }

    @Override
    public void logout(String token) {
        log.debug("Logging out user");

        // Clear security context
        SecurityContextHolder.clearContext();

        // If implementing token blacklisting, add token to blacklist here
        // For now, just log the logout
        log.info("User logged out successfully");

        // Note: In a production system, you might want to:
        // 1. Implement a token blacklist (Redis-based)
        // 2. Store invalidated tokens until their expiration
        // 3. Check blacklist in JwtAuthenticationFilter
    }

    /**
     * Build authentication response
     */
    private AuthResponse buildAuthResponse(String token, User user) {
        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name()
        );

        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getJwtExpiration(),
                userInfo
        );
    }
}
