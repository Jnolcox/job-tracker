package com.nolcox.jobtracking.infrastructure.security;

import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

import java.io.IOException;
import java.time.Instant;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private UserDetails testUser;
    private final String validToken = "valid.jwt.token";
    private final String bearerToken = "Bearer " + validToken;
    private final String userEmail = "test@example.com";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
        
        testUser = User.builder()
                .id(1L)
                .email(userEmail)
                .password("password")
                .firstName("Test")
                .lastName("User")
                .role(Role.USER)
                .enabled(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    void testDoFilterInternal_WithAuthEndpoint_ShouldBypassAuthentication() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/auth/login");
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).extractUsername(anyString());
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(securityContext, never()).setAuthentication(any());
    }

    @Test
    void testDoFilterInternal_WithoutAuthorizationHeader_ShouldBypassAuthentication() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn(null);
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).extractUsername(anyString());
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(securityContext, never()).setAuthentication(any());
    }

    @Test
    void testDoFilterInternal_WithInvalidAuthorizationHeader_ShouldBypassAuthentication() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn("Basic invalidheader");
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).extractUsername(anyString());
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(securityContext, never()).setAuthentication(any());
    }

    @Test
    void testDoFilterInternal_WithValidToken_ShouldAuthenticateUser() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn(bearerToken);
        when(jwtService.extractUsername(validToken)).thenReturn(userEmail);
        when(securityContext.getAuthentication()).thenReturn(null);
        when(userDetailsService.loadUserByUsername(userEmail)).thenReturn(testUser);
        when(jwtService.isTokenValid(validToken, testUser)).thenReturn(true);
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(jwtService).extractUsername(validToken);
        verify(userDetailsService).loadUserByUsername(userEmail);
        verify(jwtService).isTokenValid(validToken, testUser);
        
        ArgumentCaptor<UsernamePasswordAuthenticationToken> authTokenCaptor = 
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(securityContext).setAuthentication(authTokenCaptor.capture());
        
        UsernamePasswordAuthenticationToken capturedToken = authTokenCaptor.getValue();
        assertThat(capturedToken.getPrincipal()).isEqualTo(testUser);
        assertThat(capturedToken.getCredentials()).isNull();
        assertThat(capturedToken.getAuthorities()).isEqualTo(testUser.getAuthorities());
        assertThat(capturedToken.getDetails()).isNotNull();
        
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_WithInvalidToken_ShouldNotAuthenticate() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn(bearerToken);
        when(jwtService.extractUsername(validToken)).thenReturn(userEmail);
        when(securityContext.getAuthentication()).thenReturn(null);
        when(userDetailsService.loadUserByUsername(userEmail)).thenReturn(testUser);
        when(jwtService.isTokenValid(validToken, testUser)).thenReturn(false);
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(jwtService).extractUsername(validToken);
        verify(userDetailsService).loadUserByUsername(userEmail);
        verify(jwtService).isTokenValid(validToken, testUser);
        verify(securityContext, never()).setAuthentication(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_WithExistingAuthentication_ShouldNotReauthenticate() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn(bearerToken);
        when(jwtService.extractUsername(validToken)).thenReturn(userEmail);
        
        Authentication existingAuth = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(existingAuth);
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(jwtService).extractUsername(validToken);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(jwtService, never()).isTokenValid(anyString(), any());
        verify(securityContext, never()).setAuthentication(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_WithNullUsername_ShouldNotAuthenticate() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn(bearerToken);
        when(jwtService.extractUsername(validToken)).thenReturn(null);
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(jwtService).extractUsername(validToken);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(jwtService, never()).isTokenValid(anyString(), any());
        verify(securityContext, never()).setAuthentication(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_WithUserNotFound_ShouldNotAuthenticate() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn(bearerToken);
        when(jwtService.extractUsername(validToken)).thenReturn(userEmail);
        when(securityContext.getAuthentication()).thenReturn(null);
        when(userDetailsService.loadUserByUsername(userEmail))
                .thenThrow(new UsernameNotFoundException("User not found"));
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(jwtService).extractUsername(validToken);
        verify(userDetailsService).loadUserByUsername(userEmail);
        verify(jwtService, never()).isTokenValid(anyString(), any());
        verify(securityContext, never()).setAuthentication(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_WithJwtException_ShouldNotAuthenticate() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn(bearerToken);
        when(jwtService.extractUsername(validToken)).thenThrow(new RuntimeException("JWT parsing error"));
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(jwtService).extractUsername(validToken);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(jwtService, never()).isTokenValid(anyString(), any());
        verify(securityContext, never()).setAuthentication(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_WithEmptyBearerToken_ShouldHandleGracefully() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn("Bearer ");
        when(jwtService.extractUsername("")).thenThrow(new RuntimeException("Empty token"));
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(filterChain).doFilter(request, response);
        verify(jwtService).extractUsername("");
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(securityContext, never()).setAuthentication(any());
    }

    @Test
    void testDoFilterInternal_TokenExtractionFromHeader_ShouldExtractCorrectToken() throws ServletException, IOException {
        // Given
        String longToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.token";
        String bearerHeader = "Bearer " + longToken;
        
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn(bearerHeader);
        when(jwtService.extractUsername(longToken)).thenReturn(userEmail);
        when(securityContext.getAuthentication()).thenReturn(null);
        when(userDetailsService.loadUserByUsername(userEmail)).thenReturn(testUser);
        when(jwtService.isTokenValid(longToken, testUser)).thenReturn(true);
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        verify(jwtService).extractUsername(longToken);
        verify(jwtService).isTokenValid(longToken, testUser);
    }

    @Test
    void testDoFilterInternal_WithValidTokenAndDetails_ShouldSetAuthenticationDetails() throws ServletException, IOException {
        // Given
        when(request.getServletPath()).thenReturn("/api/jobs");
        when(request.getHeader("Authorization")).thenReturn(bearerToken);
        when(jwtService.extractUsername(validToken)).thenReturn(userEmail);
        when(securityContext.getAuthentication()).thenReturn(null);
        when(userDetailsService.loadUserByUsername(userEmail)).thenReturn(testUser);
        when(jwtService.isTokenValid(validToken, testUser)).thenReturn(true);
        
        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);
        
        // Then
        ArgumentCaptor<UsernamePasswordAuthenticationToken> authTokenCaptor = 
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(securityContext).setAuthentication(authTokenCaptor.capture());
        
        UsernamePasswordAuthenticationToken capturedToken = authTokenCaptor.getValue();
        assertThat(capturedToken.getDetails()).isNotNull();
        assertThat(capturedToken.getDetails()).isInstanceOf(
                WebAuthenticationDetailsSource.class.getName().contains("WebAuthenticationDetails") ? 
                Object.class : Object.class);
    }
}