package com.nolcox.jobtracking.application.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nolcox.jobtracking.application.dto.request.AuthRequest;
import com.nolcox.jobtracking.application.dto.request.RegisterRequest;
import com.nolcox.jobtracking.application.dto.response.AuthResponse;
import com.nolcox.jobtracking.application.dto.response.UserInfo;
import com.nolcox.jobtracking.application.service.AuthService;
import com.nolcox.jobtracking.fixtures.AuthRequestFixture;
import com.nolcox.jobtracking.fixtures.RegisterRequestFixture;
import com.nolcox.jobtracking.shared.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class, 
    excludeAutoConfiguration = {
        org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
        org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
    })
@ActiveProfiles("test")
@DisplayName("AuthController Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Nested
    @DisplayName("Registration Endpoint Tests")
    class RegistrationTests {

        @Test
        @DisplayName("Should register user successfully with valid request")
        void shouldRegisterUserWithValidRequest() throws Exception {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest().build();
            AuthResponse response = new AuthResponse(
                    "jwt-token",
                    "Bearer",
                    3600L,
                    new UserInfo(1L, "John", "Doe", "john.doe@example.com", "USER")
            );

            when(authService.register(any(RegisterRequest.class))).thenReturn(response);

            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.token").value("jwt-token"))
                    .andExpect(jsonPath("$.type").value("Bearer"))
                    .andExpect(jsonPath("$.expiresIn").value(3600))
                    .andExpect(jsonPath("$.user.id").value(1))
                    .andExpect(jsonPath("$.user.firstName").value("John"))
                    .andExpect(jsonPath("$.user.lastName").value("Doe"))
                    .andExpect(jsonPath("$.user.email").value("john.doe@example.com"))
                    .andExpect(jsonPath("$.user.role").value("USER"));
        }

        @Test
        @DisplayName("Should return 400 when first name is blank")
        void shouldReturn400WhenFirstNameIsBlank() throws Exception {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest()
                    .withFirstName("")
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when first name is null")
        void shouldReturn400WhenFirstNameIsNull() throws Exception {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest()
                    .withFirstName(null)
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when last name is blank")
        void shouldReturn400WhenLastNameIsBlank() throws Exception {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest()
                    .withLastName("")
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when email is invalid")
        void shouldReturn400WhenEmailIsInvalid() throws Exception {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest()
                    .withInvalidEmail()
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when email is blank")
        void shouldReturn400WhenEmailIsBlank() throws Exception {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest()
                    .withEmail("")
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when password is too short")
        void shouldReturn400WhenPasswordIsTooShort() throws Exception {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest()
                    .withPassword("1234567") // 7 characters, minimum is 8
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when password is blank")
        void shouldReturn400WhenPasswordIsBlank() throws Exception {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest()
                    .withPassword("")
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when request body is empty")
        void shouldReturn400WhenRequestBodyIsEmpty() throws Exception {
            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists());
        }

        @Test
        @DisplayName("Should return 400 when content type is not JSON")
        void shouldReturn400WhenContentTypeIsNotJson() throws Exception {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest().build();

            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.TEXT_PLAIN)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnsupportedMediaType());
        }

        @Test
        @DisplayName("Should return 409 when email already exists")
        void shouldReturn409WhenEmailAlreadyExists() throws Exception {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest().build();
            when(authService.register(any(RegisterRequest.class)))
                    .thenThrow(new BusinessException("Email already exists"));

            // When & Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Email already exists"));
        }
    }

    @Nested
    @DisplayName("Login Endpoint Tests")
    class LoginTests {

        @Test
        @DisplayName("Should authenticate user successfully with valid credentials")
        void shouldAuthenticateUserWithValidCredentials() throws Exception {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest().build();
            AuthResponse response = new AuthResponse(
                    "jwt-token",
                    "Bearer",
                    3600L,
                    new UserInfo(1L, "John", "Doe", "test@example.com", "USER")
            );

            when(authService.authenticate(any(AuthRequest.class))).thenReturn(response);

            // When & Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.token").value("jwt-token"))
                    .andExpect(jsonPath("$.type").value("Bearer"))
                    .andExpect(jsonPath("$.expiresIn").value(3600))
                    .andExpect(jsonPath("$.user.id").value(1))
                    .andExpect(jsonPath("$.user.firstName").value("John"))
                    .andExpect(jsonPath("$.user.lastName").value("Doe"))
                    .andExpect(jsonPath("$.user.email").value("test@example.com"))
                    .andExpect(jsonPath("$.user.role").value("USER"));
        }

        @Test
        @DisplayName("Should return 400 when email is invalid")
        void shouldReturn400WhenEmailIsInvalid() throws Exception {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest()
                    .withInvalidEmail()
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when email is blank")
        void shouldReturn400WhenEmailIsBlank() throws Exception {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest()
                    .withEmptyEmail()
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when email is null")
        void shouldReturn400WhenEmailIsNull() throws Exception {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest()
                    .withNullEmail()
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when password is blank")
        void shouldReturn400WhenPasswordIsBlank() throws Exception {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest()
                    .withEmptyPassword()
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when password is null")
        void shouldReturn400WhenPasswordIsNull() throws Exception {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest()
                    .withNullPassword()
                    .build();

            // When & Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @DisplayName("Should return 400 when request body is empty")
        void shouldReturn400WhenRequestBodyIsEmpty() throws Exception {
            // When & Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists());
        }

        @Test
        @DisplayName("Should return 401 when credentials are invalid")
        void shouldReturn401WhenCredentialsAreInvalid() throws Exception {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest().build();
            when(authService.authenticate(any(AuthRequest.class)))
                    .thenThrow(new BusinessException("Invalid credentials"));

            // When & Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Invalid credentials"));
        }

        @Test
        @DisplayName("Should return 400 when content type is not JSON")
        void shouldReturn400WhenContentTypeIsNotJson() throws Exception {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest().build();

            // When & Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.TEXT_PLAIN)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnsupportedMediaType());
        }
    }

    @Nested
    @DisplayName("Refresh Token Endpoint Tests")
    class RefreshTokenTests {
        
        // Note: These tests are placeholders for when refresh token endpoint is implemented
        // The current AuthController does not have refresh token functionality

        @Test
        @DisplayName("Should refresh token successfully with valid refresh token")
        void shouldRefreshTokenWithValidRefreshToken() throws Exception {
            // TODO: Implement when refresh token endpoint is added to AuthController
            // This test structure is ready for implementation
        }

        @Test
        @DisplayName("Should return 401 when refresh token is invalid")
        void shouldReturn401WhenRefreshTokenIsInvalid() throws Exception {
            // TODO: Implement when refresh token endpoint is added to AuthController
        }

        @Test
        @DisplayName("Should return 401 when refresh token is expired")
        void shouldReturn401WhenRefreshTokenIsExpired() throws Exception {
            // TODO: Implement when refresh token endpoint is added to AuthController
        }
    }

    @Nested
    @DisplayName("Logout Endpoint Tests")
    class LogoutTests {
        
        // Note: These tests are placeholders for when logout endpoint is implemented
        // The current AuthController does not have logout functionality

        @Test
        @DisplayName("Should logout successfully with valid token")
        void shouldLogoutWithValidToken() throws Exception {
            // TODO: Implement when logout endpoint is added to AuthController
            // This test structure is ready for implementation
        }

        @Test
        @DisplayName("Should return 401 when token is invalid")
        void shouldReturn401WhenTokenIsInvalid() throws Exception {
            // TODO: Implement when logout endpoint is added to AuthController
        }
    }
}