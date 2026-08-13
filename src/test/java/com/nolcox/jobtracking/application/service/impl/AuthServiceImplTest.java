package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.request.AuthRequest;
import com.nolcox.jobtracking.application.dto.request.RegisterRequest;
import com.nolcox.jobtracking.application.dto.response.AuthResponse;
import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import com.nolcox.jobtracking.fixtures.AuthRequestFixture;
import com.nolcox.jobtracking.fixtures.RegisterRequestFixture;
import com.nolcox.jobtracking.fixtures.UserFixture;
import com.nolcox.jobtracking.infrastructure.security.JwtService;
import com.nolcox.jobtracking.shared.exception.AuthenticationFailureException;
import com.nolcox.jobtracking.shared.exception.BusinessException;

import static com.nolcox.jobtracking.shared.exception.ErrorMessages.INVALID_CREDENTIALS;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthServiceImpl authService;

    private static final String TEST_JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token";
    private static final long JWT_EXPIRATION = 3600000L; // 1 hour


    @Nested
    @DisplayName("User Registration Tests")
    class RegistrationTests {

        @Test
        @DisplayName("Should successfully register a new user")
        void shouldRegisterNewUser() {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest()
                .withCredentials("john.doe@example.com", "password123")
                .withFirstName("John")
                .withLastName("Doe")
                .build();

            User savedUser = UserFixture.aUser()
                .withId(1L)
                .withEmail(request.email())
                .withFirstName(request.firstName())
                .withLastName(request.lastName())
                .build();

            when(userRepository.existsByEmail(request.email())).thenReturn(false);
            when(passwordEncoder.encode(request.password())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtService.generateToken(anyMap(), any(User.class))).thenReturn(TEST_JWT_TOKEN);
            when(jwtService.getJwtExpiration()).thenReturn(JWT_EXPIRATION);

            // When
            AuthResponse response = authService.register(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.token()).isEqualTo(TEST_JWT_TOKEN);
            assertThat(response.type()).isEqualTo("Bearer");
            assertThat(response.expiresIn()).isEqualTo(JWT_EXPIRATION);
            assertThat(response.user().email()).isEqualTo(request.email());
            assertThat(response.user().firstName()).isEqualTo(request.firstName());
            assertThat(response.user().lastName()).isEqualTo(request.lastName());
            assertThat(response.user().role()).isEqualTo("USER");

            // Verify user creation
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User createdUser = userCaptor.getValue();
            assertThat(createdUser.getEmail()).isEqualTo(request.email());
            assertThat(createdUser.getPassword()).isEqualTo("encodedPassword");
            assertThat(createdUser.getRole()).isEqualTo(Role.USER);
            assertThat(createdUser.isEnabled()).isTrue();

            // Verify JWT claims
            ArgumentCaptor<Map<String, Object>> claimsCaptor = ArgumentCaptor.forClass(Map.class);
            verify(jwtService).generateToken(claimsCaptor.capture(), eq(savedUser));
            Map<String, Object> claims = claimsCaptor.getValue();
            assertThat(claims).containsEntry("userId", 1L);
            assertThat(claims).containsEntry("role", "USER");
        }

        @Test
        @DisplayName("Should throw exception when email is already registered")
        void shouldThrowExceptionForDuplicateEmail() {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest()
                .withEmail("existing@example.com")
                .build();

            when(userRepository.existsByEmail(request.email())).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Email is already registered");

            verify(userRepository, never()).save(any());
            verify(jwtService, never()).generateToken(anyMap(), any());
        }

        @Test
        @DisplayName("Should encode password before saving")
        void shouldEncodePassword() {
            // Given
            RegisterRequest request = RegisterRequestFixture.aRegisterRequest()
                .withFirstName("Jane")
                .withLastName("Smith")
                .withCredentials("jane.smith@example.com", "plainPassword")
                .build();

            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode("plainPassword")).thenReturn("$2a$10$encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(1L);
                return user;
            });
            when(jwtService.generateToken(anyMap(), any(User.class))).thenReturn(TEST_JWT_TOKEN);
            when(jwtService.getJwtExpiration()).thenReturn(JWT_EXPIRATION);

            // When
            authService.register(request);

            // Then
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getPassword()).isEqualTo("$2a$10$encodedPassword");
        }
    }

    @Nested
    @DisplayName("Authentication Tests")
    class AuthenticationTests {

        @Test
        @DisplayName("Should successfully authenticate user with valid credentials")
        void shouldAuthenticateWithValidCredentials() {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest()
                .withCredentials("john@example.com", "password123")
                .build();

            User user = UserFixture.aUser()
                .withId(1L)
                .withEmail(request.email())
                .build();

            Authentication authentication = mock(Authentication.class);
            when(authentication.getPrincipal()).thenReturn(user);

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
            when(jwtService.generateToken(anyMap(), any(User.class))).thenReturn(TEST_JWT_TOKEN);
            when(jwtService.getJwtExpiration()).thenReturn(JWT_EXPIRATION);

            // When
            AuthResponse response = authService.authenticate(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.token()).isEqualTo(TEST_JWT_TOKEN);
            assertThat(response.user().email()).isEqualTo(request.email());
            assertThat(response.user().id()).isEqualTo(1L);

            verify(authenticationManager).authenticate(argThat(auth ->
                auth instanceof UsernamePasswordAuthenticationToken &&
                auth.getPrincipal().equals(request.email()) &&
                auth.getCredentials().equals(request.password())
            ));
        }

        @Test
        @DisplayName("Should throw AuthenticationFailureException for invalid credentials")
        void shouldThrowExceptionForInvalidCredentials() {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest()
                .withCredentials("john@example.com", "wrongPassword")
                .build();

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

            // When & Then
            // REFACTOR: Now using dedicated AuthenticationFailureException instead of generic BusinessException
            // This allows the exception handler to return HTTP 401 without fragile string matching
            assertThatThrownBy(() -> authService.authenticate(request))
                .isInstanceOf(AuthenticationFailureException.class)
                .hasMessage(INVALID_CREDENTIALS);

            verify(jwtService, never()).generateToken(anyMap(), any());
        }

        @Test
        @DisplayName("Should throw AuthenticationFailureException for non-existent user")
        void shouldThrowExceptionForNonExistentUser() {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest()
                .withEmail("nonexistent@example.com")
                .build();

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("User not found"));

            // When & Then
            // REFACTOR: AuthenticationFailureException provides type-safe handling of auth failures
            assertThatThrownBy(() -> authService.authenticate(request))
                .isInstanceOf(AuthenticationFailureException.class)
                .hasMessage(INVALID_CREDENTIALS);
        }

        @Test
        @DisplayName("Should generate JWT token with correct claims")
        void shouldGenerateJwtTokenWithCorrectClaims() {
            // Given
            AuthRequest request = AuthRequestFixture.anAuthRequest().build();
            User user = UserFixture.aUser()
                .withId(5L)
                .withRole(Role.ADMIN)
                .build();

            Authentication authentication = mock(Authentication.class);
            when(authentication.getPrincipal()).thenReturn(user);
            when(authenticationManager.authenticate(any())).thenReturn(authentication);
            when(jwtService.generateToken(anyMap(), any(User.class))).thenReturn(TEST_JWT_TOKEN);
            when(jwtService.getJwtExpiration()).thenReturn(JWT_EXPIRATION);

            // When
            authService.authenticate(request);

            // Then
            ArgumentCaptor<Map<String, Object>> claimsCaptor = ArgumentCaptor.forClass(Map.class);
            verify(jwtService).generateToken(claimsCaptor.capture(), eq(user));
            Map<String, Object> claims = claimsCaptor.getValue();
            assertThat(claims).containsEntry("userId", 5L);
            assertThat(claims).containsEntry("role", "ADMIN");
        }
    }

}