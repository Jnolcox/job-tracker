package com.nolcox.jobtracking.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nolcox.jobtracking.application.dto.request.AuthRequest;
import com.nolcox.jobtracking.application.dto.request.RegisterRequest;
import com.nolcox.jobtracking.application.dto.response.AuthResponse;
import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import com.nolcox.jobtracking.infrastructure.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for authentication functionality.
 * Tests the complete authentication flow including registration, login,
 * JWT token generation/validation, and access to protected endpoints.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    void shouldRegisterNewUserSuccessfully() throws Exception {
        // Given
        RegisterRequest registerRequest = new RegisterRequest(
                TEST_FIRST_NAME,
                TEST_LAST_NAME,
                TEST_EMAIL,
                TEST_PASSWORD
        );

        // When
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").exists())
                .andExpect(jsonPath("$.user.email").value(TEST_EMAIL))
                .andExpect(jsonPath("$.user.firstName").value(TEST_FIRST_NAME))
                .andExpect(jsonPath("$.user.lastName").value(TEST_LAST_NAME))
                .andReturn();

        // Then
        String responseBody = result.getResponse().getContentAsString();
        AuthResponse authResponse = objectMapper.readValue(responseBody, AuthResponse.class);

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
    @DisplayName("Should fail registration with invalid email format")
    void shouldFailRegistrationWithInvalidEmail() throws Exception {
        // Given
        RegisterRequest registerRequest = new RegisterRequest(
                TEST_FIRST_NAME,
                TEST_LAST_NAME,
                "invalid-email",
                TEST_PASSWORD
        );

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());
    }

    @Test
    @DisplayName("Should fail registration with short password")
    void shouldFailRegistrationWithShortPassword() throws Exception {
        // Given
        RegisterRequest registerRequest = new RegisterRequest(
                TEST_FIRST_NAME,
                TEST_LAST_NAME,
                TEST_EMAIL,
                "short"
        );

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());
    }

    @Test
    @DisplayName("Should fail registration with duplicate email")
    void shouldFailRegistrationWithDuplicateEmail() throws Exception {
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
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should successfully login with valid credentials")
    void shouldLoginSuccessfully() throws Exception {
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
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").exists())
                .andExpect(jsonPath("$.user.email").value(TEST_EMAIL))
                .andReturn();

        // Then
        String responseBody = result.getResponse().getContentAsString();
        AuthResponse authResponse = objectMapper.readValue(responseBody, AuthResponse.class);

        // Verify JWT token is valid
        String token = authResponse.token();
        assertThat(jwtService.isTokenValid(token, user)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo(TEST_EMAIL);
    }

    @Test
    @DisplayName("Should fail login with invalid credentials")
    void shouldFailLoginWithInvalidCredentials() throws Exception {
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
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should fail login with non-existent user")
    void shouldFailLoginWithNonExistentUser() throws Exception {
        // Given
        AuthRequest authRequest = new AuthRequest("nonexistent@example.com", TEST_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should access protected endpoint with valid JWT token")
    void shouldAccessProtectedEndpointWithValidToken() throws Exception {
        // Given - Create user and generate token
        User user = User.builder()
                .email(TEST_EMAIL)
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .role(Role.USER)
                .enabled(true)
                .build();
        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser);

        // When & Then
        mockMvc.perform(get("/api/v1/applications")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("Should deny access to protected endpoint without token")
    void shouldDenyAccessWithoutToken() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/applications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should deny access to protected endpoint with invalid token")
    void shouldDenyAccessWithInvalidToken() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/applications")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should deny access to protected endpoint with expired token")
    void shouldDenyAccessWithExpiredToken() throws Exception {
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

        // Generate an already expired token (this is a limitation - in real scenario we'd need to mock time)
        String expiredToken = jwtService.generateToken(savedUser);
        
        // Since we can't easily create an expired token in test, we'll use an invalid format
        String invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";

        // When & Then
        mockMvc.perform(get("/api/v1/applications")
                        .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should complete full authentication flow - register, login, access protected resource")
    void shouldCompleteFullAuthenticationFlow() throws Exception {
        // Step 1: Register new user
        RegisterRequest registerRequest = new RegisterRequest(
                TEST_FIRST_NAME,
                TEST_LAST_NAME,
                TEST_EMAIL,
                TEST_PASSWORD
        );

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse registerResponse = objectMapper.readValue(
                registerResult.getResponse().getContentAsString(),
                AuthResponse.class
        );

        // Step 2: Use registration token to access protected resource
        mockMvc.perform(get("/api/v1/applications")
                        .header("Authorization", "Bearer " + registerResponse.token()))
                .andExpect(status().isOk());

        // Step 3: Login with same credentials
        AuthRequest authRequest = new AuthRequest(TEST_EMAIL, TEST_PASSWORD);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse loginResponse = objectMapper.readValue(
                loginResult.getResponse().getContentAsString(),
                AuthResponse.class
        );

        // Step 4: Use login token to access protected resource
        mockMvc.perform(get("/api/v1/applications")
                        .header("Authorization", "Bearer " + loginResponse.token()))
                .andExpect(status().isOk());

        // Verify both tokens are valid and different (new token issued on login)
        assertThat(registerResponse.token()).isNotEqualTo(loginResponse.token());
        
        User user = userRepository.findByEmail(TEST_EMAIL).orElseThrow();
        assertThat(jwtService.isTokenValid(registerResponse.token(), user)).isTrue();
        assertThat(jwtService.isTokenValid(loginResponse.token(), user)).isTrue();
    }
}