package com.nolcox.jobtracking.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nolcox.jobtracking.application.dto.request.AuthRequest;
import com.nolcox.jobtracking.application.dto.request.RegisterRequest;
import com.nolcox.jobtracking.application.dto.response.AuthResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.yml")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class FullLoginFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private RegisterRequest registerRequest;
    private AuthRequest loginRequest;
    
    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest(
                "John",
                "Doe",
                "john.doe@example.com",
                "Password123!"
        );
                
        loginRequest = new AuthRequest(
                "john.doe@example.com",
                "Password123!"
        );
    }

    @Test
    void shouldCompleteFullLoginFlow() throws Exception {
        // 1. Register a new user
        MvcResult registerResult = mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.user.firstName").value("John"))
                .andReturn();

        AuthResponse registerResponse = objectMapper.readValue(
                registerResult.getResponse().getContentAsString(), AuthResponse.class);
        String token = registerResponse.token();

        // 2. Verify we can access protected endpoints with the token
        mockMvc.perform(get("/v1/job-applications")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 3. Login with the same user
        mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.user.firstName").value("John"));

        // 4. Verify unauthorized access fails
        mockMvc.perform(get("/v1/job-applications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldFailWithInvalidCredentials() throws Exception {
        // Register user first
        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        // Try login with wrong password
        AuthRequest wrongPasswordRequest = new AuthRequest(
                "john.doe@example.com",
                "WrongPassword"
        );

        mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrongPasswordRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldFailWithNonExistentUser() throws Exception {
        AuthRequest nonExistentUserRequest = new AuthRequest(
                "nonexistent@example.com",
                "Password123!"
        );

        mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nonExistentUserRequest)))
                .andExpect(status().isUnauthorized());
    }
}