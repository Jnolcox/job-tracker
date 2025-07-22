package com.nolcox.jobtracking.integration;

import com.nolcox.jobtracking.application.dto.request.AuthRequest;
import com.nolcox.jobtracking.application.dto.request.RegisterRequest;
import com.nolcox.jobtracking.application.dto.response.AuthResponse;
import com.nolcox.jobtracking.application.service.AuthService;
import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import com.nolcox.jobtracking.infrastructure.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Simplified Integration tests for authentication functionality.
 * Tests the complete authentication flow without MockMvc to avoid web layer complexity.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthIntegrationTestSimple {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String TEST_EMAIL = "test@example.com";
    private final String TEST_PASSWORD = "password123";
    private final String TEST_FIRST_NAME = "John";
    private final String TEST_LAST_NAME = "Doe";

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should successfully register a new user and return JWT token")
    void shouldRegisterNewUserSuccessfully() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest(
                TEST_FIRST_NAME,
                TEST_LAST_NAME,
                TEST_EMAIL,
                TEST_PASSWORD
        );

        // When
        AuthResponse authResponse = authService.register(registerRequest);

        // Then
        assertThat(authResponse).isNotNull();
        assertThat(authResponse.token()).isNotNull();
        assertThat(authResponse.type()).isEqualTo("Bearer");
        assertThat(authResponse.expiresIn()).isNotNull();
        assertThat(authResponse.user().email()).isEqualTo(TEST_EMAIL);
        assertThat(authResponse.user().firstName()).isEqualTo(TEST_FIRST_NAME);
        assertThat(authResponse.user().lastName()).isEqualTo(TEST_LAST_NAME);

        // Verify user was created in database
        User savedUser = userRepository.findByEmail(TEST_EMAIL).orElse(null);
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getFirstName()).isEqualTo(TEST_FIRST_NAME);
        assertThat(savedUser.getLastName()).isEqualTo(TEST_LAST_NAME);
        assertThat(savedUser.getRole()).isEqualTo(Role.USER);
        assertThat(passwordEncoder.matches(TEST_PASSWORD, savedUser.getPassword())).isTrue();

        // Verify JWT token is valid
        String token = authResponse.token();
        assertThat(jwtService.isTokenValid(token, savedUser)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo(TEST_EMAIL);
    }

    @Test
    @DisplayName("Should fail registration with duplicate email")
    void shouldFailRegistrationWithDuplicateEmail() {
        // Given - Create existing user
        User existingUser = User.builder()
                .email(TEST_EMAIL)
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .firstName("Existing")
                .lastName("User")
                .role(Role.USER)
                .enabled(true)
                .build();
        userRepository.save(existingUser);

        RegisterRequest registerRequest = new RegisterRequest(
                TEST_FIRST_NAME,
                TEST_LAST_NAME,
                TEST_EMAIL,
                TEST_PASSWORD
        );

        // When & Then
        assertThrows(Exception.class, () -> authService.register(registerRequest));
    }

    @Test
    @DisplayName("Should successfully login with valid credentials")
    void shouldLoginSuccessfully() {
        // Given - Create user
        User user = User.builder()
                .email(TEST_EMAIL)
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .role(Role.USER)
                .enabled(true)
                .build();
        userRepository.save(user);

        AuthRequest authRequest = new AuthRequest(TEST_EMAIL, TEST_PASSWORD);

        // When
        AuthResponse authResponse = authService.authenticate(authRequest);

        // Then
        assertThat(authResponse).isNotNull();
        assertThat(authResponse.token()).isNotNull();
        assertThat(authResponse.type()).isEqualTo("Bearer");
        assertThat(authResponse.expiresIn()).isNotNull();
        assertThat(authResponse.user().email()).isEqualTo(TEST_EMAIL);

        // Verify JWT token is valid
        String token = authResponse.token();
        assertThat(jwtService.isTokenValid(token, user)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo(TEST_EMAIL);
    }

    @Test
    @DisplayName("Should fail login with invalid credentials")
    void shouldFailLoginWithInvalidCredentials() {
        // Given - Create user
        User user = User.builder()
                .email(TEST_EMAIL)
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .role(Role.USER)
                .enabled(true)
                .build();
        userRepository.save(user);

        AuthRequest authRequest = new AuthRequest(TEST_EMAIL, "wrongpassword");

        // When & Then
        assertThrows(Exception.class, () -> authService.authenticate(authRequest));
    }

    @Test
    @DisplayName("Should fail login with non-existent user")
    void shouldFailLoginWithNonExistentUser() {
        // Given
        AuthRequest authRequest = new AuthRequest("nonexistent@example.com", TEST_PASSWORD);

        // When & Then
        assertThrows(Exception.class, () -> authService.authenticate(authRequest));
    }

    @Test
    @DisplayName("Should complete full authentication flow - register then login")
    void shouldCompleteFullAuthenticationFlow() {
        // Step 1: Register new user
        RegisterRequest registerRequest = new RegisterRequest(
                TEST_FIRST_NAME,
                TEST_LAST_NAME,
                TEST_EMAIL,
                TEST_PASSWORD
        );

        AuthResponse registerResponse = authService.register(registerRequest);
        assertThat(registerResponse.token()).isNotNull();

        // Step 2: Login with same credentials
        AuthRequest authRequest = new AuthRequest(TEST_EMAIL, TEST_PASSWORD);
        AuthResponse loginResponse = authService.authenticate(authRequest);
        assertThat(loginResponse.token()).isNotNull();

        // Verify both tokens are valid and different (new token issued on login)
        assertThat(registerResponse.token()).isNotEqualTo(loginResponse.token());
        
        User user = userRepository.findByEmail(TEST_EMAIL).orElseThrow();
        assertThat(jwtService.isTokenValid(registerResponse.token(), user)).isTrue();
        assertThat(jwtService.isTokenValid(loginResponse.token(), user)).isTrue();
    }

    @Test
    @DisplayName("Should generate valid JWT tokens with correct expiration")
    void shouldGenerateValidJwtTokens() {
        // Given - Create user
        User user = User.builder()
                .email(TEST_EMAIL)
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .role(Role.USER)
                .enabled(true)
                .build();
        User savedUser = userRepository.save(user);

        // When
        String token = jwtService.generateToken(savedUser);

        // Then
        assertThat(token).isNotNull();
        assertThat(jwtService.isTokenValid(token, savedUser)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo(TEST_EMAIL);
        
        // Verify token expiration is greater than current time
        assertThat(jwtService.getJwtExpiration()).isGreaterThan(0);
    }
}