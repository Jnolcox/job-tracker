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
import com.nolcox.jobtracking.shared.exception.AuthenticationFailureException;
import com.nolcox.jobtracking.shared.exception.BusinessException;

import static com.nolcox.jobtracking.shared.exception.ErrorMessages.*;
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
            throw new BusinessException(EMAIL_ALREADY_REGISTERED);
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

        // Generate JWT token with standard claims
        String jwtToken = jwtService.generateToken(buildExtraClaims(savedUser), savedUser);

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

            // Generate JWT token with standard claims
            String jwtToken = jwtService.generateToken(buildExtraClaims(user), user);

            log.info("User authenticated successfully: {}", user.getEmail());

            // Build response
            return buildAuthResponse(jwtToken, user);

        } catch (BadCredentialsException e) {
            log.warn("Authentication failed for email: {}", request.email());
            // SECURITY: Use dedicated exception type for authentication failures
            // This allows the exception handler to return HTTP 401 without fragile string matching
            throw new AuthenticationFailureException(INVALID_CREDENTIALS);
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
                    .orElseThrow(() -> new BusinessException(USER_NOT_FOUND));

            // Validate refresh token
            if (!jwtService.isTokenValid(refreshToken, user)) {
                throw new BusinessException(INVALID_REFRESH_TOKEN);
            }

            // Generate new access token with standard claims
            String newAccessToken = jwtService.generateToken(buildExtraClaims(user), user);

            log.info("Token refreshed successfully for user: {}", user.getEmail());

            return buildAuthResponse(newAccessToken, user);

        } catch (Exception e) {
            log.error("Error refreshing token", e);
            throw new BusinessException(TOKEN_REFRESH_FAILED);
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
     * Builds the extra claims map for JWT tokens.
     *
     * <p>These claims are embedded in the JWT payload and used for authorization
     * decisions without requiring database lookups.</p>
     *
     * @param user the authenticated user
     * @return map containing userId and role claims
     */
    private Map<String, Object> buildExtraClaims(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("role", user.getRole().name());
        return extraClaims;
    }

    /**
     * Builds the authentication response DTO.
     *
     * @param token the JWT access token
     * @param user the authenticated user
     * @return the auth response containing token and user info
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
