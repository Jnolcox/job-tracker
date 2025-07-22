package com.nolcox.jobtracking.infrastructure.security;

import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails testUser;
    private final String testSecretKey = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final long testExpiration = 86400000; // 24 hours
    private final long testRefreshExpiration = 604800000; // 7 days

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        
        // Set private fields using ReflectionTestUtils
        ReflectionTestUtils.setField(jwtService, "secretKey", testSecretKey);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", testExpiration);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", testRefreshExpiration);
        
        // Create test user
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("password")
                .firstName("Test")
                .lastName("User")
                .role(Role.USER)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testGenerateToken_WithUserDetails_ShouldReturnValidToken() {
        // When
        String token = jwtService.generateToken(testUser);
        
        // Then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts separated by dots
    }

    @Test
    void testGenerateToken_WithExtraClaims_ShouldIncludeCustomClaims() {
        // Given
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", 1L);
        extraClaims.put("role", "USER");
        
        // When
        String token = jwtService.generateToken(extraClaims, testUser);
        
        // Then
        assertThat(token).isNotNull();
        
        // Verify custom claims are included
        Claims claims = jwtService.extractClaim(token, claims1 -> claims1);
        assertThat(claims.get("userId", Long.class)).isEqualTo(1L);
        assertThat(claims.get("role", String.class)).isEqualTo("USER");
    }

    @Test
    void testGenerateRefreshToken_ShouldReturnValidTokenWithLongerExpiration() {
        // When
        String refreshToken = jwtService.generateRefreshToken(testUser);
        
        // Then
        assertThat(refreshToken).isNotNull();
        assertThat(refreshToken).isNotEmpty();
        
        // Verify expiration time
        Date expiration = jwtService.extractClaim(refreshToken, Claims::getExpiration);
        Date issuedAt = jwtService.extractClaim(refreshToken, Claims::getIssuedAt);
        long actualExpiration = expiration.getTime() - issuedAt.getTime();
        
        assertThat(actualExpiration).isEqualTo(testRefreshExpiration);
    }

    @Test
    void testExtractUsername_WithValidToken_ShouldReturnCorrectUsername() {
        // Given
        String token = jwtService.generateToken(testUser);
        
        // When
        String extractedUsername = jwtService.extractUsername(token);
        
        // Then
        assertThat(extractedUsername).isEqualTo(testUser.getUsername());
    }

    @Test
    void testExtractUserId_WithTokenContainingUserId_ShouldReturnUserId() {
        // Given
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", 1L);
        String token = jwtService.generateToken(extraClaims, testUser);
        
        // When
        Long extractedUserId = jwtService.extractUserId(token);
        
        // Then
        assertThat(extractedUserId).isEqualTo(1L);
    }

    @Test
    void testExtractClaim_WithValidToken_ShouldReturnCorrectClaim() {
        // Given
        String token = jwtService.generateToken(testUser);
        
        // When
        String subject = jwtService.extractClaim(token, Claims::getSubject);
        Date expiration = jwtService.extractClaim(token, Claims::getExpiration);
        Date issuedAt = jwtService.extractClaim(token, Claims::getIssuedAt);
        
        // Then
        assertThat(subject).isEqualTo(testUser.getUsername());
        assertThat(expiration).isAfter(new Date());
        assertThat(issuedAt).isBefore(new Date());
    }

    @Test
    void testIsTokenValid_WithValidToken_ShouldReturnTrue() {
        // Given
        String token = jwtService.generateToken(testUser);
        
        // When
        boolean isValid = jwtService.isTokenValid(token, testUser);
        
        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    void testIsTokenValid_WithTokenForDifferentUser_ShouldReturnFalse() {
        // Given
        String token = jwtService.generateToken(testUser);
        UserDetails differentUser = User.builder()
                .email("different@example.com")
                .password("password")
                .firstName("Different")
                .lastName("User")
                .role(Role.USER)
                .build();
        
        // When
        boolean isValid = jwtService.isTokenValid(token, differentUser);
        
        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    void testIsTokenValid_WithExpiredToken_ShouldThrowException() {
        // Given - Create service with very short expiration
        JwtService shortExpirationService = new JwtService();
        ReflectionTestUtils.setField(shortExpirationService, "secretKey", testSecretKey);
        ReflectionTestUtils.setField(shortExpirationService, "jwtExpiration", 1L); // 1ms
        
        String token = shortExpirationService.generateToken(testUser);
        
        // Wait for token to expire
        try {
            Thread.sleep(50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // When & Then - Should throw ExpiredJwtException when trying to validate
        assertThatThrownBy(() -> shortExpirationService.isTokenValid(token, testUser))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void testExtractUsername_WithMalformedToken_ShouldThrowException() {
        // Given
        String malformedToken = "invalid.token.format";
        
        // When & Then
        assertThatThrownBy(() -> jwtService.extractUsername(malformedToken))
                .isInstanceOf(MalformedJwtException.class);
    }

    @Test
    void testExtractUsername_WithInvalidSignature_ShouldThrowException() {
        // Given
        String token = jwtService.generateToken(testUser);
        String tamperedToken = token.substring(0, token.length() - 10) + "tampered123";
        
        // When & Then
        assertThatThrownBy(() -> jwtService.extractUsername(tamperedToken))
                .isInstanceOf(SignatureException.class);
    }

    @Test
    void testExtractUsername_WithExpiredToken_ShouldThrowExpiredJwtException() {
        // Given - Create service with very short expiration
        JwtService shortExpirationService = new JwtService();
        ReflectionTestUtils.setField(shortExpirationService, "secretKey", testSecretKey);
        ReflectionTestUtils.setField(shortExpirationService, "jwtExpiration", 1L); // 1ms
        
        String token = shortExpirationService.generateToken(testUser);
        
        // Wait for token to expire
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // When & Then
        assertThatThrownBy(() -> shortExpirationService.extractUsername(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void testGetJwtExpiration_ShouldReturnCorrectValue() {
        // When
        long expiration = jwtService.getJwtExpiration();
        
        // Then
        assertThat(expiration).isEqualTo(testExpiration);
    }

    @Test
    void testGetRefreshExpiration_ShouldReturnCorrectValue() {
        // When
        long refreshExpiration = jwtService.getRefreshExpiration();
        
        // Then
        assertThat(refreshExpiration).isEqualTo(testRefreshExpiration);
    }

    @Test
    void testTokenExpirationTime_ShouldBeCorrect() {
        // Given
        String token = jwtService.generateToken(testUser);
        
        // When
        Date expiration = jwtService.extractClaim(token, Claims::getExpiration);
        Date issuedAt = jwtService.extractClaim(token, Claims::getIssuedAt);
        
        // Then
        long actualExpiration = expiration.getTime() - issuedAt.getTime();
        assertThat(actualExpiration).isEqualTo(testExpiration);
    }

    @Test
    void testTokenStructure_ShouldContainCorrectClaims() {
        // Given
        String token = jwtService.generateToken(testUser);
        
        // When
        Claims claims = jwtService.extractClaim(token, claims1 -> claims1);
        
        // Then
        assertThat(claims.getSubject()).isEqualTo(testUser.getUsername());
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isNotNull();
        assertThat(claims.getExpiration()).isAfter(claims.getIssuedAt());
    }
}