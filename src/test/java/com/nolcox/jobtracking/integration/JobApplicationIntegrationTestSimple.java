package com.nolcox.jobtracking.integration;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.application.service.JobApplicationService;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.Level;
import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.RtoType;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import com.nolcox.jobtracking.shared.exception.ResourceNotFoundException;
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;

/**
 * Simplified Integration tests for Job Application functionality.
 * Tests the complete CRUD operations with database interactions and security integration.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JobApplicationIntegrationTestSimple {

    @Autowired
    private JobApplicationService jobApplicationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private User otherUser;

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
    }

    @Test
    @DisplayName("Should create job application successfully")
    void shouldCreateJobApplicationSuccessfully() {
        // Given
        JobApplicationCreateRequest request = new JobApplicationCreateRequest(
                TEST_COMPANY,
                TEST_POSITION,
                TEST_DESCRIPTION,
                ApplicationStatus.APPLIED,
                "https://example.com/job",
                TEST_SALARY_MIN,
                TEST_SALARY_MAX,
                "San Francisco, CA",
                RtoType.HYBRID_3,
                Level.MID, // level
                "Looks like a great opportunity",
                "Jane Smith",
                "jane.smith@techcorp.com",
                "+1-555-0123",
                null, // appliedDate
                null, // statusChangedAt
                null  // interviewDate
        );

        // When
        JobApplicationResponse response = jobApplicationService.createApplication(request, testUser.getId());

        // Then
        assertThat(response).isNotNull();
        assertThat(response.id()).isNotNull();
        assertThat(response.companyName()).isEqualTo(TEST_COMPANY);
        assertThat(response.positionTitle()).isEqualTo(TEST_POSITION);
        assertThat(response.jobDescription()).isEqualTo(TEST_DESCRIPTION);
        assertThat(response.status()).isEqualTo(ApplicationStatus.APPLIED);
        assertThat(response.salaryMin()).isEqualTo(TEST_SALARY_MIN);
        assertThat(response.salaryMax()).isEqualTo(TEST_SALARY_MAX);
        assertThat(response.appliedDate()).isNotNull();
        assertThat(response.createdAt()).isNotNull();

        // Verify in database
        JobApplication savedApplication = jobApplicationRepository.findById(response.id()).orElse(null);
        assertThat(savedApplication).isNotNull();
        assertThat(savedApplication.getCompanyName()).isEqualTo(TEST_COMPANY);
        assertThat(savedApplication.getPositionTitle()).isEqualTo(TEST_POSITION);
        assertThat(savedApplication.getUser().getId()).isEqualTo(testUser.getId());
        assertThat(savedApplication.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
    }

    @Test
    @DisplayName("Should get all job applications for user")
    void shouldGetAllJobApplicationsForUser() {
        // Given - Create test applications for both users
        JobApplication app1 = createJobApplication(testUser, "Company A", "Role A");
        JobApplication app2 = createJobApplication(testUser, "Company B", "Role B");
        JobApplication otherApp = createJobApplication(otherUser, "Company C", "Role C");

        // When
        Page<JobApplicationResponse> applications = jobApplicationService.getUserApplications(
                testUser.getId(), null, null, Pageable.unpaged());

        // Then
        assertThat(applications.getContent()).hasSize(2);
        assertThat(applications.getContent().get(0).companyName()).isIn("Company A", "Company B");
        assertThat(applications.getContent().get(1).companyName()).isIn("Company A", "Company B");
        
        // Verify other user's application is not included
        assertThat(applications.getContent()).noneMatch(app -> app.companyName().equals("Company C"));
    }

    @Test
    @DisplayName("Should filter job applications by status")
    void shouldFilterJobApplicationsByStatus() {
        // Given
        JobApplication appliedApp = createJobApplication(testUser, "Company A", "Role A");
        appliedApp.setStatus(ApplicationStatus.APPLIED);
        jobApplicationRepository.save(appliedApp);

        JobApplication interviewApp = createJobApplication(testUser, "Company B", "Role B");
        interviewApp.setStatus(ApplicationStatus.TECH_SCREEN);
        jobApplicationRepository.save(interviewApp);

        // When - Filter by APPLIED status
        Page<JobApplicationResponse> applications = jobApplicationService.getUserApplications(
                testUser.getId(), ApplicationStatus.APPLIED, null, Pageable.unpaged());

        // Then
        assertThat(applications.getContent()).hasSize(1);
        assertThat(applications.getContent().get(0).status()).isEqualTo(ApplicationStatus.APPLIED);
        assertThat(applications.getContent().get(0).companyName()).isEqualTo("Company A");
    }

    @Test
    @DisplayName("Should filter job applications by company name")
    void shouldFilterJobApplicationsByCompanyName() {
        // Given
        createJobApplication(testUser, "Tech Corp", "Developer");
        createJobApplication(testUser, "Other Corp", "Engineer");

        // When - Filter by company name
        Page<JobApplicationResponse> applications = jobApplicationService.getUserApplications(
                testUser.getId(), null, "Tech Corp", Pageable.unpaged());

        // Then
        assertThat(applications.getContent()).hasSize(1);
        assertThat(applications.getContent().get(0).companyName()).isEqualTo("Tech Corp");
    }

    @Test
    @DisplayName("Should get specific job application by ID")
    void shouldGetJobApplicationById() {
        // Given
        JobApplication application = createJobApplication(testUser, TEST_COMPANY, TEST_POSITION);

        // When
        JobApplicationResponse response = jobApplicationService.getApplication(application.getId(), testUser.getId());

        // Then
        assertThat(response.id()).isEqualTo(application.getId());
        assertThat(response.companyName()).isEqualTo(TEST_COMPANY);
        assertThat(response.positionTitle()).isEqualTo(TEST_POSITION);
    }

    @Test
    @DisplayName("Should fail to get another user's job application")
    void shouldFailToGetOtherUsersJobApplication() {
        // Given - Create application for other user
        JobApplication otherApplication = createJobApplication(otherUser, TEST_COMPANY, TEST_POSITION);

        // When & Then - Try to access with different user's ID
        assertThrows(UnauthorizedException.class, () ->
            jobApplicationService.getApplication(otherApplication.getId(), testUser.getId()));
    }

    @Test
    @DisplayName("Should update job application successfully")
    void shouldUpdateJobApplicationSuccessfully() {
        // Given
        JobApplication application = createJobApplication(testUser, TEST_COMPANY, TEST_POSITION);
        
        JobApplicationUpdateRequest updateRequest = new JobApplicationUpdateRequest(
                "Updated Company",
                "Updated Position",
                "Updated description",
                "https://example.com/updated-job",
                ApplicationStatus.TECH_SCREEN,
                null,
                null,
                Instant.now().plus(Duration.ofDays(3)),
                75000.0,
                85000.0,
                "San Francisco, CA",
                RtoType.HYBRID_3,
                Level.SENIOR, // level
                "Updated notes",
                "John Doe",
                "john.doe@updated.com",
                "+1-555-9999"
        );

        // When
        JobApplicationResponse response = jobApplicationService.updateApplication(
                application.getId(), updateRequest, testUser.getId());

        // Then
        assertThat(response.companyName()).isEqualTo("Updated Company");
        assertThat(response.positionTitle()).isEqualTo("Updated Position");
        assertThat(response.status()).isEqualTo(ApplicationStatus.TECH_SCREEN);
        assertThat(response.salaryMin()).isEqualTo(75000.0);
        assertThat(response.salaryMax()).isEqualTo(85000.0);

        // Verify in database
        JobApplication updatedApplication = jobApplicationRepository.findById(application.getId()).orElse(null);
        assertThat(updatedApplication).isNotNull();
        assertThat(updatedApplication.getCompanyName()).isEqualTo("Updated Company");
        assertThat(updatedApplication.getStatus()).isEqualTo(ApplicationStatus.TECH_SCREEN);
    }

    @Test
    @DisplayName("Should fail to update another user's job application")
    void shouldFailToUpdateOtherUsersJobApplication() {
        // Given - Create application for other user
        JobApplication otherApplication = createJobApplication(otherUser, TEST_COMPANY, TEST_POSITION);
        
        JobApplicationUpdateRequest updateRequest = new JobApplicationUpdateRequest(
                "Hacked Company",
                "Hacked Position",
                "Should not work",
                null,
                ApplicationStatus.REJECTED,
                null,
                null,
                null,
                1000000.0,
                2000000.0,
                null,
                null,
                null, // level
                "Hacking attempt",
                "Hacker",
                "hacker@evil.com",
                "+1-555-HACK"
        );

        // When & Then - Try to update with different user's ID
        assertThrows(UnauthorizedException.class, () ->
            jobApplicationService.updateApplication(otherApplication.getId(), updateRequest, testUser.getId()));

        // Verify original data is unchanged
        JobApplication unchanged = jobApplicationRepository.findById(otherApplication.getId()).orElse(null);
        assertThat(unchanged).isNotNull();
        assertThat(unchanged.getCompanyName()).isEqualTo(TEST_COMPANY);
        assertThat(unchanged.getPositionTitle()).isEqualTo(TEST_POSITION);
    }

    @Test
    @DisplayName("Should delete job application successfully")
    void shouldDeleteJobApplicationSuccessfully() {
        // Given
        JobApplication application = createJobApplication(testUser, TEST_COMPANY, TEST_POSITION);
        Long applicationId = application.getId();

        // When
        jobApplicationService.deleteApplication(applicationId, testUser.getId());

        // Then - Verify deletion
        assertThat(jobApplicationRepository.findById(applicationId)).isEmpty();
    }

    @Test
    @DisplayName("Should fail to delete another user's job application")
    void shouldFailToDeleteOtherUsersJobApplication() {
        // Given - Create application for other user
        JobApplication otherApplication = createJobApplication(otherUser, TEST_COMPANY, TEST_POSITION);
        Long applicationId = otherApplication.getId();

        // When & Then - Try to delete with different user's ID
        assertThrows(UnauthorizedException.class, () ->
            jobApplicationService.deleteApplication(applicationId, testUser.getId()));

        // Then - Verify application still exists
        assertThat(jobApplicationRepository.findById(applicationId)).isPresent();
    }

    @Test
    @DisplayName("Should handle non-existent job application gracefully")
    void shouldHandleNonExistentJobApplication() {
        // Given
        Long nonExistentId = 99999L;

        // When & Then - GET
        assertThrows(ResourceNotFoundException.class, () -> 
            jobApplicationService.getApplication(nonExistentId, testUser.getId()));

        // When & Then - PUT
        JobApplicationUpdateRequest updateRequest = new JobApplicationUpdateRequest(
                "Company", "Position", "Description", null, ApplicationStatus.APPLIED,
                null, null, null, null, null, null, null, null, null, null, null, null
        );

        assertThrows(ResourceNotFoundException.class, () -> 
            jobApplicationService.updateApplication(nonExistentId, updateRequest, testUser.getId()));

        // When & Then - DELETE
        assertThrows(ResourceNotFoundException.class, () -> 
            jobApplicationService.deleteApplication(nonExistentId, testUser.getId()));
    }

    @Test
    @DisplayName("Should support pagination")
    void shouldSupportPagination() {
        // Given - Create multiple applications
        for (int i = 1; i <= 5; i++) {
            createJobApplication(testUser, "Company " + i, "Position " + i);
        }

        // When - Request with pagination
        Page<JobApplicationResponse> applications = jobApplicationService.getUserApplications(
                testUser.getId(), null, null, Pageable.ofSize(2));

        // Then
        assertThat(applications.getContent()).hasSize(2);
        assertThat(applications.getTotalElements()).isEqualTo(5);
        assertThat(applications.getTotalPages()).isEqualTo(3);
        assertThat(applications.getNumber()).isEqualTo(0);
        assertThat(applications.getSize()).isEqualTo(2);
    }

    @Test
    @DisplayName("Should complete full CRUD lifecycle")
    void shouldCompleteFullCrudLifecycle() {
        // Step 1: Create application
        JobApplicationCreateRequest createRequest = new JobApplicationCreateRequest(
                TEST_COMPANY,
                TEST_POSITION,
                TEST_DESCRIPTION,
                ApplicationStatus.APPLIED,
                "https://example.com/job",
                TEST_SALARY_MIN,
                TEST_SALARY_MAX,
                "San Francisco, CA",
                RtoType.HYBRID_3,
                Level.MID, // level
                "Initial notes",
                "Jane Smith",
                "jane@example.com",
                "+1-555-0123",
                null, // appliedDate
                null, // statusChangedAt
                null  // interviewDate
        );

        JobApplicationResponse created = jobApplicationService.createApplication(createRequest, testUser.getId());
        assertThat(created.companyName()).isEqualTo(TEST_COMPANY);

        // Step 2: Read the created application
        JobApplicationResponse read = jobApplicationService.getApplication(created.id(), testUser.getId());
        assertThat(read.companyName()).isEqualTo(TEST_COMPANY);

        // Step 3: Update the application
        JobApplicationUpdateRequest updateRequest2 = new JobApplicationUpdateRequest(
                TEST_COMPANY,
                TEST_POSITION,
                TEST_DESCRIPTION,
                "https://example.com/job",
                ApplicationStatus.TECH_SCREEN,
                null,
                null,
                Instant.now().plus(Duration.ofDays(2)),
                TEST_SALARY_MIN,
                TEST_SALARY_MAX,
                "San Francisco, CA",
                RtoType.HYBRID_3,
                Level.MID, // level
                "Updated after interview scheduled",
                "Jane Smith",
                "jane@example.com",
                "+1-555-0123"
        );

        JobApplicationResponse updated = jobApplicationService.updateApplication(
                created.id(), updateRequest2, testUser.getId());
        assertThat(updated.status()).isEqualTo(ApplicationStatus.TECH_SCREEN);

        // Step 4: Verify the update
        JobApplicationResponse verified = jobApplicationService.getApplication(created.id(), testUser.getId());
        assertThat(verified.status()).isEqualTo(ApplicationStatus.TECH_SCREEN);

        // Step 5: Delete the application
        jobApplicationService.deleteApplication(created.id(), testUser.getId());

        // Step 6: Verify deletion
        assertThrows(ResourceNotFoundException.class, () -> 
            jobApplicationService.getApplication(created.id(), testUser.getId()));
    }

    // Helper method to create job applications
    private JobApplication createJobApplication(User user, String companyName, String positionTitle) {
        JobApplication application = JobApplication.builder()
                .user(user)
                .companyName(companyName)
                .positionTitle(positionTitle)
                .jobDescription("Test job description")
                .status(ApplicationStatus.APPLIED)
                .appliedDate(Instant.now())
                .salaryMin(TEST_SALARY_MIN)
                .salaryMax(TEST_SALARY_MAX)
                .location("San Francisco, CA")
                .rtoType(RtoType.HYBRID_3)
                .notes("Test notes")
                .build();
        return jobApplicationRepository.save(application);
    }
}