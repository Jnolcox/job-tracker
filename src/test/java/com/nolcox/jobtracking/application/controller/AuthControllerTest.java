package com.nolcox.jobtracking.application.controller;

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
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController Tests")
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @Nested
    @DisplayName("Registration Endpoint Tests")
    class RegistrationTests {

        @Test
        @DisplayName("Should register user successfully with valid request")
        void shouldRegisterUserWithValidRequest() {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest().build();
            AuthResponse expectedResponse = new AuthResponse(
                    "jwt-token",
                    "Bearer",
                    3600L,
                    new UserInfo(1L, "john.doe@example.com", "John", "Doe", "USER")
            );

            when(authService.register(any(RegisterRequest.class))).thenReturn(expectedResponse);

            // When
            ResponseEntity<AuthResponse> response = authController.register(request);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().token()).isEqualTo("jwt-token");
            assertThat(response.getBody().type()).isEqualTo("Bearer");
            assertThat(response.getBody().expiresIn()).isEqualTo(3600L);
            assertThat(response.getBody().user().id()).isEqualTo(1L);
            assertThat(response.getBody().user().firstName()).isEqualTo("John");
            assertThat(response.getBody().user().lastName()).isEqualTo("Doe");
            assertThat(response.getBody().user().email()).isEqualTo("john.doe@example.com");
            assertThat(response.getBody().user().role()).isEqualTo("USER");
        }

        @Test
        @DisplayName("Should handle registration failure gracefully")
        void shouldHandleRegistrationFailure() {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest().build();
            when(authService.register(any(RegisterRequest.class)))
                    .thenThrow(new BusinessException("Email already exists"));

            // When & Then
            assertThatThrownBy(() -> authController.register(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("Email already exists");
        }
    }

    @Nested
    @DisplayName("Login Endpoint Tests")
    class LoginTests {

        @Test
        @DisplayName("Should authenticate user with valid credentials")
        void shouldAuthenticateUserWithValidCredentials() {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest().build();
            AuthResponse expectedResponse = new AuthResponse(
                    "jwt-token",
                    "Bearer",
                    3600L,
                    new UserInfo(1L, "john.doe@example.com", "John", "Doe", "USER")
            );

            when(authService.authenticate(any(AuthRequest.class))).thenReturn(expectedResponse);

            // When
            ResponseEntity<AuthResponse> response = authController.authenticate(request);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().token()).isEqualTo("jwt-token");
            assertThat(response.getBody().type()).isEqualTo("Bearer");
            assertThat(response.getBody().expiresIn()).isEqualTo(3600L);
            assertThat(response.getBody().user().email()).isEqualTo("john.doe@example.com");
        }

        @Test
        @DisplayName("Should handle authentication failure gracefully")
        void shouldHandleAuthenticationFailure() {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest().build();
            when(authService.authenticate(any(AuthRequest.class)))
                    .thenThrow(new BusinessException("Invalid credentials"));

            // When & Then
            assertThatThrownBy(() -> authController.authenticate(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("Invalid credentials");
        }
    }
}