package com.nolcox.jobtracking.integration;

import com.nolcox.jobtracking.config.SecurityConfig;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

/**
 * Test configuration for integration tests.
 * This configuration ensures proper setup of beans needed for integration testing
 * while maintaining the same security configuration as production.
 */
@TestConfiguration
@Import(SecurityConfig.class)
@TestPropertySource(locations = "classpath:application-test.yml")
public class TestConfig {

    /**
     * Provides password encoder for integration tests.
     * Uses BCrypt which is the same as production to ensure
     * password hashing works correctly in tests.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}