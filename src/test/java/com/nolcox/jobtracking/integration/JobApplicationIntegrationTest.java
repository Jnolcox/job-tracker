package com.nolcox.jobtracking.integration;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import com.nolcox.jobtracking.infrastructure.security.JwtService;

/**
 * Integration tests for Job Application functionality.
 * Tests the complete CRUD operations with database interactions,
 * security integration, and business rules validation.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class JobApplicationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User testUser;
    private User otherUser;
    private String userToken;

    private final String TEST_COMPANY = "Tech Corp";
    private final String TEST_POSITION = "Software Engineer";
    private final String TEST_DESCRIPTION = "Exciting opportunity to work with cutting-edge technology";
    private final Double TEST_SALARY_MIN = 70000.0;
    private final Double TEST_SALARY_MAX = 80000.0;

    @BeforeEach
    void setUp() {
        // Clean up database
        jobApplicationRepository.deleteAll();
        userRepository.deleteAll();

        // Create test users
        testUser = User.builder()
                .email("test@example.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Test")
                .lastName("User")
                .role(Role.USER)
                .enabled(true)
                .build();
        testUser = userRepository.save(testUser);

        otherUser = User.builder()
                .email("other@example.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Other")
                .lastName("User")
                .role(Role.USER)
                .enabled(true)
                .build();
        otherUser = userRepository.save(otherUser);

        // Generate JWT tokens
        userToken = jwtService.generateToken(testUser);
    }

    @Test
    @DisplayName("Should create job application successfully")
    void shouldCreateJobApplicationSuccessfully() throws Exception {
        // Given
        JobApplicationCreateRequest request = new JobApplicationCreateRequest(
                TEST_COMPANY,
                TEST_POSITION,
                TEST_DESCRIPTION,
                ApplicationStatus.APPLIED,
                "https://example.com/job",
                TEST_SALARY_MIN,
                TEST_SALARY_MAX,
                "Looks like a great opportunity",
                "Jane Smith",
                "jane.smith@techcorp.com",
                "+1-555-0123"
        );

        // When
        MvcResult result = mockMvc.perform(post("/v1/job-applications")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.companyName").value(TEST_COMPANY))
                .andExpect(jsonPath("$.positionTitle").value(TEST_POSITION))
                .andExpect(jsonPath("$.jobDescription").value(TEST_DESCRIPTION))
                .andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.salaryMin").value(70000.0))
                .andExpect(jsonPath("$.salaryMax").value(80000.0))
                .andExpect(jsonPath("$.appliedDate").exists())
                .andExpect(jsonPath("$.createdAt").exists())
                .andReturn();

        // Then
        String responseBody = result.getResponse().getContentAsString();
        JobApplicationResponse response = objectMapper.readValue(responseBody, JobApplicationResponse.class);

        // Verify in database
        JobApplication savedApplication = jobApplicationRepository.findById(response.id()).orElse(null);
        assertThat(savedApplication).isNotNull();
        assertThat(savedApplication.getCompanyName()).isEqualTo(TEST_COMPANY);
        assertThat(savedApplication.getPositionTitle()).isEqualTo(TEST_POSITION);
        assertThat(savedApplication.getUser().getId()).isEqualTo(testUser.getId());
        assertThat(savedApplication.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
    }

    @Test
    @DisplayName("Should fail to create job application with invalid data")
    void shouldFailToCreateJobApplicationWithInvalidData() throws Exception {
        // Given - Missing required fields
        JobApplicationCreateRequest request = new JobApplicationCreateRequest(
                "", // Empty company name
                "", // Empty position title
                TEST_DESCRIPTION,
                ApplicationStatus.APPLIED,
                "https://example.com/job",
                TEST_SALARY_MIN,
                TEST_SALARY_MAX,
                "Notes",
                "Jane Smith",
                "invalid-email", // Invalid email format
                "+1-555-0123"
        );

        // When & Then
        mockMvc.perform(post("/v1/job-applications")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());
    }

    @Test
    @DisplayName("Should get all job applications for authenticated user")
    void shouldGetAllJobApplicationsForUser() throws Exception {
        // Given - Create test applications for both users
        createJobApplication(testUser, "Company A", "Role A");
        createJobApplication(testUser, "Company B", "Role B");
        createJobApplication(otherUser, "Company C", "Role C");

        // When
        mockMvc.perform(get("/v1/job-applications")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].companyName").value("Company A"))
                .andExpect(jsonPath("$.content[1].companyName").value("Company B"));

        // Verify other user's application is not included
        MvcResult result = mockMvc.perform(get("/v1/job-applications")
                        .header("Authorization", "Bearer " + userToken))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).doesNotContain("Company C");
    }

    @Test
    @DisplayName("Should filter job applications by status")
    void shouldFilterJobApplicationsByStatus() throws Exception {
        // Given
        JobApplication appliedApp = createJobApplication(testUser, "Company A", "Role A");
        appliedApp.setStatus(ApplicationStatus.APPLIED);
        jobApplicationRepository.save(appliedApp);

        JobApplication interviewApp = createJobApplication(testUser, "Company B", "Role B");
        interviewApp.setStatus(ApplicationStatus.TECH_SCREEN);
        jobApplicationRepository.save(interviewApp);

        // When - Filter by APPLIED status
        mockMvc.perform(get("/v1/job-applications")
                        .param("status", "APPLIED")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].status").value("APPLIED"))
                .andExpect(jsonPath("$.content[0].companyName").value("Company A"));
    }

    @Test
    @DisplayName("Should filter job applications by company name")
    void shouldFilterJobApplicationsByCompanyName() throws Exception {
        // Given
        createJobApplication(testUser, "Tech Corp", "Developer");
        createJobApplication(testUser, "Other Corp", "Engineer");

        // When - Filter by company name
        mockMvc.perform(get("/v1/job-applications")
                        .param("companyName", "Tech Corp")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].companyName").value("Tech Corp"));
    }

    @Test
    @DisplayName("Should get specific job application by ID")
    void shouldGetJobApplicationById() throws Exception {
        // Given
        JobApplication application = createJobApplication(testUser, TEST_COMPANY, TEST_POSITION);

        // When
        mockMvc.perform(get("/v1/job-applications/{id}", application.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(application.getId()))
                .andExpect(jsonPath("$.companyName").value(TEST_COMPANY))
                .andExpect(jsonPath("$.positionTitle").value(TEST_POSITION));
    }

    @Test
    @DisplayName("Should fail to get another user's job application")
    void shouldFailToGetOtherUsersJobApplication() throws Exception {
        // Given - Create application for other user
        JobApplication otherApplication = createJobApplication(otherUser, TEST_COMPANY, TEST_POSITION);

        // When - Try to access with different user's token
        mockMvc.perform(get("/v1/job-applications/{id}", otherApplication.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should update job application successfully")
    void shouldUpdateJobApplicationSuccessfully() throws Exception {
        // Given
        JobApplication application = createJobApplication(testUser, TEST_COMPANY, TEST_POSITION);
        
        JobApplicationUpdateRequest updateRequest = new JobApplicationUpdateRequest(
                "Updated Company",
                "Updated Position",
                "Updated description",
                "https://example.com/updated-job",
                ApplicationStatus.TECH_SCREEN,
                LocalDateTime.now().plusDays(3),
                75000.0,
                85000.0,
                "Updated notes",
                "John Doe",
                "john.doe@updated.com",
                "+1-555-9999"
        );

        // When
        mockMvc.perform(put("/v1/job-applications/{id}", application.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Updated Company"))
                .andExpect(jsonPath("$.positionTitle").value("Updated Position"))
                .andExpect(jsonPath("$.status").value("TECH_SCREEN"))
                .andExpect(jsonPath("$.salaryMin").value(75000.0))
                .andExpect(jsonPath("$.salaryMax").value(85000.0));

        // Verify in database
        JobApplication updatedApplication = jobApplicationRepository.findById(application.getId()).orElse(null);
        assertThat(updatedApplication).isNotNull();
        assertThat(updatedApplication.getCompanyName()).isEqualTo("Updated Company");
        assertThat(updatedApplication.getStatus()).isEqualTo(ApplicationStatus.TECH_SCREEN);
    }

    @Test
    @DisplayName("Should fail to update another user's job application")
    void shouldFailToUpdateOtherUsersJobApplication() throws Exception {
        // Given - Create application for other user
        JobApplication otherApplication = createJobApplication(otherUser, TEST_COMPANY, TEST_POSITION);
        
        JobApplicationUpdateRequest updateRequest = new JobApplicationUpdateRequest(
                "Hacked Company",
                "Hacked Position",
                "Should not work",
                null,
                ApplicationStatus.REJECTED,
                null,
                1000000.0,
                2000000.0,
                "Hacking attempt",
                "Hacker",
                "hacker@evil.com",
                "+1-555-HACK"
        );

        // When - Try to update with different user's token
        mockMvc.perform(put("/v1/job-applications/{id}", otherApplication.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden());

        // Verify original data is unchanged
        JobApplication unchanged = jobApplicationRepository.findById(otherApplication.getId()).orElse(null);
        assertThat(unchanged).isNotNull();
        assertThat(unchanged.getCompanyName()).isEqualTo(TEST_COMPANY);
        assertThat(unchanged.getPositionTitle()).isEqualTo(TEST_POSITION);
    }

    @Test
    @DisplayName("Should delete job application successfully")
    void shouldDeleteJobApplicationSuccessfully() throws Exception {
        // Given
        JobApplication application = createJobApplication(testUser, TEST_COMPANY, TEST_POSITION);
        Long applicationId = application.getId();

        // When
        mockMvc.perform(delete("/v1/job-applications/{id}", applicationId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        // Then - Verify deletion
        assertThat(jobApplicationRepository.findById(applicationId)).isEmpty();
    }

    @Test
    @DisplayName("Should fail to delete another user's job application")
    void shouldFailToDeleteOtherUsersJobApplication() throws Exception {
        // Given - Create application for other user
        JobApplication otherApplication = createJobApplication(otherUser, TEST_COMPANY, TEST_POSITION);
        Long applicationId = otherApplication.getId();

        // When - Try to delete with different user's token
        mockMvc.perform(delete("/v1/job-applications/{id}", applicationId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        // Then - Verify application still exists
        assertThat(jobApplicationRepository.findById(applicationId)).isPresent();
    }

    @Test
    @DisplayName("Should handle non-existent job application gracefully")
    void shouldHandleNonExistentJobApplication() throws Exception {
        // Given
        Long nonExistentId = 99999L;

        // When & Then - GET
        mockMvc.perform(get("/v1/job-applications/{id}", nonExistentId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());

        // When & Then - PUT
        JobApplicationUpdateRequest updateRequest = new JobApplicationUpdateRequest(
                "Company", "Position", "Description", null, ApplicationStatus.APPLIED,
                null, null, null, null, null, null, null
        );

        mockMvc.perform(put("/v1/job-applications/{id}", nonExistentId)
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());

        // When & Then - DELETE
        mockMvc.perform(delete("/v1/job-applications/{id}", nonExistentId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should require authentication for all endpoints")
    void shouldRequireAuthentication() throws Exception {
        // Given
        JobApplication application = createJobApplication(testUser, TEST_COMPANY, TEST_POSITION);
        
        JobApplicationCreateRequest createRequest = new JobApplicationCreateRequest(
                "Company",
                "Position",
                "Description",
                ApplicationStatus.APPLIED,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        JobApplicationUpdateRequest updateRequest = new JobApplicationUpdateRequest(
                "Company", "Position", "Description", null, ApplicationStatus.APPLIED,
                null, null, null, null, null, null, null
        );

        // When & Then - All endpoints should require authentication
        mockMvc.perform(get("/v1/job-applications"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/v1/job-applications/{id}", application.getId()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/v1/job-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/v1/job-applications/{id}", application.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/v1/job-applications/{id}", application.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should support pagination")
    void shouldSupportPagination() throws Exception {
        // Given - Create multiple applications
        for (int i = 1; i <= 5; i++) {
            createJobApplication(testUser, "Company " + i, "Position " + i);
        }

        // When - Request with pagination
        mockMvc.perform(get("/v1/job-applications")
                        .param("page", "0")
                        .param("size", "2")
                        .param("sort", "companyName,asc")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(2));
    }

    @Test
    @DisplayName("Should complete full CRUD lifecycle")
    void shouldCompleteFullCrudLifecycle() throws Exception {
        // Step 1: Create application
        JobApplicationCreateRequest createRequest = new JobApplicationCreateRequest(
                TEST_COMPANY,
                TEST_POSITION,
                TEST_DESCRIPTION,
                ApplicationStatus.APPLIED,
                "https://example.com/job",
                TEST_SALARY_MIN,
                TEST_SALARY_MAX,
                "Initial notes",
                "Jane Smith",
                "jane@example.com",
                "+1-555-0123"
        );

        MvcResult createResult = mockMvc.perform(post("/v1/job-applications")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JobApplicationResponse created = objectMapper.readValue(
                createResult.getResponse().getContentAsString(),
                JobApplicationResponse.class
        );

        // Step 2: Read the created application
        mockMvc.perform(get("/v1/job-applications/{id}", created.id())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value(TEST_COMPANY));

        // Step 3: Update the application
        JobApplicationUpdateRequest updateRequest = new JobApplicationUpdateRequest(
                TEST_COMPANY,
                TEST_POSITION,
                TEST_DESCRIPTION,
                "https://example.com/job",
                ApplicationStatus.TECH_SCREEN,
                LocalDateTime.now().plusDays(2),
                TEST_SALARY_MIN,
                TEST_SALARY_MAX,
                "Updated after interview scheduled",
                "Jane Smith",
                "jane@example.com",
                "+1-555-0123"
        );

        mockMvc.perform(put("/v1/job-applications/{id}", created.id())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TECH_SCREEN"));

        // Step 4: Verify the update
        mockMvc.perform(get("/v1/job-applications/{id}", created.id())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TECH_SCREEN"));

        // Step 5: Delete the application
        mockMvc.perform(delete("/v1/job-applications/{id}", created.id())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        // Step 6: Verify deletion
        mockMvc.perform(get("/v1/job-applications/{id}", created.id())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    // Helper method to create job applications
    private JobApplication createJobApplication(User user, String companyName, String positionTitle) {
        JobApplication application = JobApplication.builder()
                .user(user)
                .companyName(companyName)
                .positionTitle(positionTitle)
                .jobDescription("Test job description")
                .status(ApplicationStatus.APPLIED)
                .appliedDate(LocalDateTime.now())
                .salaryMin(TEST_SALARY_MIN)
                .salaryMax(TEST_SALARY_MAX)
                .notes("Test notes")
                .build();
        return jobApplicationRepository.save(application);
    }
}