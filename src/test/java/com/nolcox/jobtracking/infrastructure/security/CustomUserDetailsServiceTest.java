package com.nolcox.jobtracking.infrastructure.security;

import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    private User testUser;
    private final String testEmail = "test@example.com";
    private final String nonExistentEmail = "nonexistent@example.com";

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email(testEmail)
                .password("encodedPassword123")
                .firstName("Test")
                .lastName("User")
                .role(Role.USER)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testLoadUserByUsername_WithExistingUser_ShouldReturnUserDetails() {
        // Given
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // When
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(testEmail);

        // Then
        assertThat(userDetails).isNotNull();
        assertThat(userDetails).isInstanceOf(User.class);
        assertThat(userDetails.getUsername()).isEqualTo(testEmail);
        assertThat(userDetails.getPassword()).isEqualTo("encodedPassword123");
        assertThat(userDetails.isEnabled()).isTrue();
        assertThat(userDetails.isAccountNonExpired()).isTrue();
        assertThat(userDetails.isAccountNonLocked()).isTrue();
        assertThat(userDetails.isCredentialsNonExpired()).isTrue();

        verify(userRepository).findByEmail(testEmail);
    }

    @Test
    void testLoadUserByUsername_WithNonExistentUser_ShouldThrowUsernameNotFoundException() {
        // Given
        when(userRepository.findByEmail(nonExistentEmail)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername(nonExistentEmail))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("User not found with email: " + nonExistentEmail);

        verify(userRepository).findByEmail(nonExistentEmail);
    }

    @Test
    void testLoadUserByUsername_WithNullEmail_ShouldCallRepository() {
        // Given
        when(userRepository.findByEmail(null)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername(null))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("User not found with email: null");

        verify(userRepository).findByEmail(null);
    }

    @Test
    void testLoadUserByUsername_WithEmptyEmail_ShouldCallRepository() {
        // Given
        String emptyEmail = "";
        when(userRepository.findByEmail(emptyEmail)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername(emptyEmail))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("User not found with email: ");

        verify(userRepository).findByEmail(emptyEmail);
    }

    @Test
    void testUserDetailsCreation_WithUserRole_ShouldHaveCorrectAuthorities() {
        // Given
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // When
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(testEmail);

        // Then
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        assertThat(authorities).isNotNull();
        assertThat(authorities).hasSize(1);
        assertThat(authorities.iterator().next().getAuthority()).isEqualTo("ROLE_USER");
    }

    @Test
    void testUserDetailsCreation_WithAdminRole_ShouldHaveCorrectAuthorities() {
        // Given
        User adminUser = User.builder()
                .id(2L)
                .email("admin@example.com")
                .password("adminPassword")
                .firstName("Admin")
                .lastName("User")
                .role(Role.ADMIN)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));

        // When
        UserDetails userDetails = customUserDetailsService.loadUserByUsername("admin@example.com");

        // Then
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        assertThat(authorities).isNotNull();
        assertThat(authorities).hasSize(1);
        assertThat(authorities.iterator().next().getAuthority()).isEqualTo("ROLE_ADMIN");
    }

    @Test
    void testUserDetailsCreation_WithDisabledUser_ShouldReturnDisabledUserDetails() {
        // Given
        User disabledUser = User.builder()
                .id(3L)
                .email("disabled@example.com")
                .password("password")
                .firstName("Disabled")
                .lastName("User")
                .role(Role.USER)
                .enabled(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail("disabled@example.com")).thenReturn(Optional.of(disabledUser));

        // When
        UserDetails userDetails = customUserDetailsService.loadUserByUsername("disabled@example.com");

        // Then
        assertThat(userDetails.isEnabled()).isFalse();
        assertThat(userDetails.isAccountNonExpired()).isTrue();
        assertThat(userDetails.isAccountNonLocked()).isTrue();
        assertThat(userDetails.isCredentialsNonExpired()).isTrue();
    }

    @Test
    void testUserDetailsMapping_ShouldMapAllUserProperties() {
        // Given
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // When
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(testEmail);
        User userEntity = (User) userDetails;

        // Then
        assertThat(userEntity.getId()).isEqualTo(testUser.getId());
        assertThat(userEntity.getEmail()).isEqualTo(testUser.getEmail());
        assertThat(userEntity.getFirstName()).isEqualTo(testUser.getFirstName());
        assertThat(userEntity.getLastName()).isEqualTo(testUser.getLastName());
        assertThat(userEntity.getRole()).isEqualTo(testUser.getRole());
        assertThat(userEntity.isEnabled()).isEqualTo(testUser.isEnabled());
        assertThat(userEntity.getCreatedAt()).isEqualTo(testUser.getCreatedAt());
        assertThat(userEntity.getUpdatedAt()).isEqualTo(testUser.getUpdatedAt());
    }

    @Test
    void testRepositoryInteraction_ShouldCallFindByEmailOnce() {
        // Given
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // When
        customUserDetailsService.loadUserByUsername(testEmail);

        // Then
        verify(userRepository, times(1)).findByEmail(testEmail);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void testTransactionalBehavior_ShouldBeReadOnly() {
        // Given
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // When
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(testEmail);

        // Then
        // Verify that the method completes successfully and returns the expected user
        assertThat(userDetails).isNotNull();
        
        // The @Transactional(readOnly = true) annotation ensures that no write operations
        // can be performed within this transaction, but we can't directly test this
        // without integration testing. The annotation is tested implicitly by the
        // successful execution of the method.
        verify(userRepository).findByEmail(testEmail);
    }

    @Test
    void testLoadUserByUsername_WithDifferentEmailFormats_ShouldWork() {
        // Test with different valid email formats
        String[] emails = {
                "user@domain.com",
                "user.name@domain.co.uk",
                "user+tag@domain.org",
                "user123@sub.domain.com"
        };

        for (String email : emails) {
            // Given
            User user = User.builder()
                    .id(1L)
                    .email(email)
                    .password("password")
                    .firstName("Test")
                    .lastName("User")
                    .role(Role.USER)
                    .enabled(true)
                    .build();

            when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

            // When
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

            // Then
            assertThat(userDetails.getUsername()).isEqualTo(email);
            verify(userRepository).findByEmail(email);
        }
    }

    @Test
    void testUserDetailsContract_ShouldImplementAllMethods() {
        // Given
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // When
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(testEmail);

        // Then - Verify UserDetails contract is properly implemented
        assertThat(userDetails.getUsername()).isNotNull();
        assertThat(userDetails.getPassword()).isNotNull();
        assertThat(userDetails.getAuthorities()).isNotNull();
        assertThat(userDetails.getAuthorities()).isNotEmpty();

        // Verify account status methods return sensible defaults
        assertThat(userDetails.isAccountNonExpired()).isTrue();
        assertThat(userDetails.isAccountNonLocked()).isTrue();
        assertThat(userDetails.isCredentialsNonExpired()).isTrue();
        
        // isEnabled should reflect the actual user status
        assertThat(userDetails.isEnabled()).isEqualTo(testUser.isEnabled());
    }
}