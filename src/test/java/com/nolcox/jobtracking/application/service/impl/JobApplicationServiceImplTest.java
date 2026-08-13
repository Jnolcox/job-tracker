package com.nolcox.jobtracking.application.service.impl;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.ApplicationEventRepository;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.fixtures.JobApplicationFixture;
import com.nolcox.jobtracking.fixtures.JobApplicationRequestFixture;
import com.nolcox.jobtracking.fixtures.UserFixture;
import com.nolcox.jobtracking.shared.exception.ResourceNotFoundException;
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;
import org.modelmapper.ModelMapper;

@ExtendWith(MockitoExtension.class)
@DisplayName("JobApplicationService Tests")
class JobApplicationServiceImplTest {

    @Mock
    private JobApplicationRepository repository;

    @Mock
    private ApplicationEventRepository eventRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private JobApplicationUpdateMapper updateMapper;

    @InjectMocks
    private JobApplicationServiceImpl jobApplicationService;

    @Captor
    private ArgumentCaptor<JobApplication> applicationCaptor;

    @Captor
    private ArgumentCaptor<Set<ApplicationStatus>> statusSetCaptor;

    private User testUser;
    private JobApplication testApplication;

    @BeforeEach
    void setUp() {
        testUser = UserFixture.aUser()
            .withId(1L)
            .withEmail("test@example.com")
            .build();


        testApplication = JobApplicationFixture.aJobApplication()
            .withId(1L)
            .withUser(testUser)
            .withCompanyName("Tech Corp")
            .withPositionTitle("Software Engineer")
            .build();
    }

    @Nested
    @DisplayName("Get All Applications Tests")
    class GetAllApplicationsTests {

        @Test
        @DisplayName("Should get user applications with pagination")
        void shouldGetUserApplicationsWithPagination() {
            // Given
            Long userId = 1L;
            Pageable pageable = PageRequest.of(0, 10);
            List<JobApplication> applications = List.of(testApplication);
            Page<JobApplication> applicationPage = new PageImpl<>(applications, pageable, 1);

            when(repository.findByUserIdWithFilters(userId, null, null, pageable))
                .thenReturn(applicationPage);

            // When
            Page<JobApplicationResponse> result = jobApplicationService
                .getUserApplications(userId, null, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            
            JobApplicationResponse response = result.getContent().get(0);
            assertThat(response.id()).isEqualTo(testApplication.getId());
            assertThat(response.companyName()).isEqualTo(testApplication.getCompanyName());
            assertThat(response.positionTitle()).isEqualTo(testApplication.getPositionTitle());
            assertThat(response.status()).isEqualTo(testApplication.getStatus());
            
            assertThat(result.getTotalElements()).isEqualTo(1);

            verify(repository).findByUserIdWithFilters(userId, null, null, pageable);
        }

        @Test
        @DisplayName("Should get user applications with status filter")
        void shouldGetUserApplicationsWithStatusFilter() {
            // Given
            Long userId = 1L;
            ApplicationStatus status = ApplicationStatus.TECH_SCREEN;
            Pageable pageable = PageRequest.of(0, 10);

            when(repository.findByUserIdWithFilters(userId, status, null, pageable))
                .thenReturn(Page.empty());

            // When
            Page<JobApplicationResponse> result = jobApplicationService
                .getUserApplications(userId, status, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();

            verify(repository).findByUserIdWithFilters(userId, status, null, pageable);
        }
    }

    @Nested
    @DisplayName("Get Application By ID Tests")
    class GetApplicationByIdTests {

        @Test
        @DisplayName("Should get application by ID for authorized user")
        void shouldGetApplicationByIdForAuthorizedUser() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;

            when(repository.findById(applicationId)).thenReturn(Optional.of(testApplication));

            // When
            JobApplicationResponse result = jobApplicationService
                .getApplication(applicationId, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(testApplication.getId());
            assertThat(result.companyName()).isEqualTo(testApplication.getCompanyName());
            assertThat(result.positionTitle()).isEqualTo(testApplication.getPositionTitle());

            verify(repository).findById(applicationId);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when application not found")
        void shouldThrowResourceNotFoundExceptionWhenApplicationNotFound() {
            // Given
            Long applicationId = 999L;
            Long userId = 1L;

            when(repository.findById(applicationId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> jobApplicationService.getApplication(applicationId, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Application not found");

            verify(repository).findById(applicationId);
        }

        @Test
        @DisplayName("Should throw UnauthorizedException when user not authorized")
        void shouldThrowUnauthorizedExceptionWhenUserNotAuthorized() {
            // Given
            Long applicationId = 1L;
            Long userId = 2L; // Different user

            when(repository.findById(applicationId)).thenReturn(Optional.of(testApplication));

            // When & Then
            assertThatThrownBy(() -> jobApplicationService.getApplication(applicationId, userId))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Access denied");

            verify(repository).findById(applicationId);
        }
    }

    @Nested
    @DisplayName("Delete Application Tests")
    class DeleteApplicationTests {

        @Test
        @DisplayName("Should delete application for authorized user")
        void shouldDeleteApplicationForAuthorizedUser() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;

            when(repository.findById(applicationId)).thenReturn(Optional.of(testApplication));

            // When
            jobApplicationService.deleteApplication(applicationId, userId);

            // Then
            verify(repository).findById(applicationId);
            verify(repository).delete(testApplication);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when application not found")
        void shouldThrowResourceNotFoundExceptionWhenApplicationNotFound() {
            // Given
            Long applicationId = 999L;
            Long userId = 1L;

            when(repository.findById(applicationId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> jobApplicationService.deleteApplication(applicationId, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Application not found");

            verify(repository).findById(applicationId);
            verify(repository, never()).delete(any(JobApplication.class));
        }

        @Test
        @DisplayName("Should throw UnauthorizedException when user not authorized")
        void shouldThrowUnauthorizedExceptionWhenUserNotAuthorized() {
            // Given
            Long applicationId = 1L;
            Long userId = 2L; // Different user

            when(repository.findById(applicationId)).thenReturn(Optional.of(testApplication));

            // When & Then
            assertThatThrownBy(() -> jobApplicationService.deleteApplication(applicationId, userId))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Access denied");

            verify(repository).findById(applicationId);
            verify(repository, never()).delete(any(JobApplication.class));
        }
    }

    @Nested
    @DisplayName("Update Application Tests")
    class UpdateApplicationTests {

        @Test
        @DisplayName("Should auto-update statusChangedAt to now when status changes and no explicit date provided")
        void shouldAutoUpdateStatusChangedAtWhenStatusChangesAndNoDateProvided() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;
            Instant originalStatusChangedAt = Instant.now().minus(Duration.ofDays(5));

            JobApplication existingApplication = JobApplicationFixture.aJobApplication()
                .withId(applicationId)
                .withUser(testUser)
                .withStatus(ApplicationStatus.APPLIED)
                .withStatusChangedAt(originalStatusChangedAt)
                .build();

            // Request changes status from APPLIED to TECH_SCREEN but does NOT provide statusChangedAt
            // This is the typical case where user updates status and expects auto-timestamping
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withStatus(ApplicationStatus.TECH_SCREEN)
                .withStatusChangedAt(null)  // No explicit date provided
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(existingApplication));

            // Mock modelMapper to update the application's status
            doAnswer(invocation -> {
                JobApplication app = invocation.getArgument(1);
                app.setStatus(ApplicationStatus.TECH_SCREEN);
                app.setCompanyName(request.companyName());
                app.setPositionTitle(request.positionTitle());
                // ModelMapper would set statusChangedAt to null since request has null
                app.setStatusChangedAt(null);
                return null;
            }).when(updateMapper).applyTo(eq(request), any(JobApplication.class));

            when(repository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Instant beforeUpdate = Instant.now();

            // When
            jobApplicationService.updateApplication(applicationId, request, userId);

            // Then
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();

            // statusChangedAt should be auto-updated to current time since status changed
            // and no explicit date was provided
            assertThat(savedApplication.getStatusChangedAt()).isAfterOrEqualTo(beforeUpdate);
            assertThat(savedApplication.getStatusChangedAt()).isNotEqualTo(originalStatusChangedAt);
        }

        @Test
        @DisplayName("Should use provided statusChangedAt when status does not change")
        void shouldUseProvidedStatusChangedAtWhenStatusDoesNotChange() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;
            Instant providedStatusChangedAt = Instant.now().minus(Duration.ofDays(3));

            JobApplication existingApplication = JobApplicationFixture.aJobApplication()
                .withId(applicationId)
                .withUser(testUser)
                .withStatus(ApplicationStatus.APPLIED)
                .withStatusChangedAt(Instant.now().minus(Duration.ofDays(10)))
                .build();

            // Request keeps same status but provides a different statusChangedAt
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withStatus(ApplicationStatus.APPLIED)
                .withStatusChangedAt(providedStatusChangedAt)
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(existingApplication));

            // Mock modelMapper - status stays the same
            doAnswer(invocation -> {
                JobApplication app = invocation.getArgument(1);
                app.setStatus(ApplicationStatus.APPLIED);
                app.setCompanyName(request.companyName());
                app.setPositionTitle(request.positionTitle());
                return null;
            }).when(updateMapper).applyTo(eq(request), any(JobApplication.class));

            when(repository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            jobApplicationService.updateApplication(applicationId, request, userId);

            // Then
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();

            // statusChangedAt should use the provided value since status didn't change
            assertThat(savedApplication.getStatusChangedAt()).isEqualTo(providedStatusChangedAt);
        }

        @Test
        @DisplayName("Should preserve existing statusChangedAt when status does not change and no value provided")
        void shouldPreserveExistingStatusChangedAtWhenStatusDoesNotChangeAndNoValueProvided() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;
            Instant existingStatusChangedAt = Instant.now().minus(Duration.ofDays(10));

            JobApplication existingApplication = JobApplicationFixture.aJobApplication()
                .withId(applicationId)
                .withUser(testUser)
                .withStatus(ApplicationStatus.APPLIED)
                .withStatusChangedAt(existingStatusChangedAt)
                .build();

            // Request keeps same status and doesn't provide statusChangedAt
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withStatus(ApplicationStatus.APPLIED)
                .withStatusChangedAt(null)
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(existingApplication));

            // Mock modelMapper - status stays the same
            doAnswer(invocation -> {
                JobApplication app = invocation.getArgument(1);
                app.setStatus(ApplicationStatus.APPLIED);
                app.setCompanyName(request.companyName());
                app.setPositionTitle(request.positionTitle());
                return null;
            }).when(updateMapper).applyTo(eq(request), any(JobApplication.class));

            when(repository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            jobApplicationService.updateApplication(applicationId, request, userId);

            // Then
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();

            // statusChangedAt should remain unchanged
            assertThat(savedApplication.getStatusChangedAt()).isEqualTo(existingStatusChangedAt);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when application not found")
        void shouldThrowResourceNotFoundExceptionWhenApplicationNotFound() {
            // Given
            Long applicationId = 999L;
            Long userId = 1L;

            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> jobApplicationService.updateApplication(applicationId, request, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Application not found");

            verify(repository).findById(applicationId);
            verify(repository, never()).save(any(JobApplication.class));
        }

        @Test
        @DisplayName("Should throw UnauthorizedException when user not authorized")
        void shouldThrowUnauthorizedExceptionWhenUserNotAuthorized() {
            // Given
            Long applicationId = 1L;
            Long userId = 2L; // Different user

            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(testApplication));

            // When & Then
            assertThatThrownBy(() -> jobApplicationService.updateApplication(applicationId, request, userId))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Access denied");

            verify(repository).findById(applicationId);
            verify(repository, never()).save(any(JobApplication.class));
        }

        @Test
        @DisplayName("Should preserve original appliedDate when request does not include it")
        void shouldPreserveOriginalAppliedDateWhenRequestDoesNotIncludeIt() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;
            Instant originalAppliedDate = Instant.now().minus(Duration.ofDays(30));

            JobApplication existingApplication = JobApplicationFixture.aJobApplication()
                .withId(applicationId)
                .withUser(testUser)
                .withStatus(ApplicationStatus.APPLIED)
                .withAppliedDate(originalAppliedDate)
                .build();

            // Request does NOT include appliedDate (null)
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withStatus(ApplicationStatus.APPLIED)
                .withAppliedDate(null)
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(existingApplication));

            // Mock modelMapper - simulates ModelMapper potentially clearing appliedDate
            doAnswer(invocation -> {
                JobApplication app = invocation.getArgument(1);
                app.setStatus(ApplicationStatus.APPLIED);
                app.setCompanyName(request.companyName());
                app.setPositionTitle(request.positionTitle());
                // Simulate ModelMapper overwriting appliedDate with null from request
                app.setAppliedDate(null);
                return null;
            }).when(updateMapper).applyTo(eq(request), any(JobApplication.class));

            when(repository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            jobApplicationService.updateApplication(applicationId, request, userId);

            // Then
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();

            // appliedDate should be preserved from the original entity
            assertThat(savedApplication.getAppliedDate()).isEqualTo(originalAppliedDate);
        }

        @Test
        @DisplayName("Should update appliedDate when request explicitly includes it")
        void shouldUpdateAppliedDateWhenRequestExplicitlyIncludesIt() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;
            Instant originalAppliedDate = Instant.now().minus(Duration.ofDays(30));
            Instant newAppliedDate = Instant.now().minus(Duration.ofDays(15));

            JobApplication existingApplication = JobApplicationFixture.aJobApplication()
                .withId(applicationId)
                .withUser(testUser)
                .withStatus(ApplicationStatus.APPLIED)
                .withAppliedDate(originalAppliedDate)
                .build();

            // Request explicitly includes a new appliedDate
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withStatus(ApplicationStatus.APPLIED)
                .withAppliedDate(newAppliedDate)
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(existingApplication));

            // Mock modelMapper - updates appliedDate from request
            doAnswer(invocation -> {
                JobApplication app = invocation.getArgument(1);
                app.setStatus(ApplicationStatus.APPLIED);
                app.setCompanyName(request.companyName());
                app.setPositionTitle(request.positionTitle());
                app.setAppliedDate(newAppliedDate);
                return null;
            }).when(updateMapper).applyTo(eq(request), any(JobApplication.class));

            when(repository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            jobApplicationService.updateApplication(applicationId, request, userId);

            // Then
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();

            // appliedDate should be updated to the new value from the request
            assertThat(savedApplication.getAppliedDate()).isEqualTo(newAppliedDate);
        }

        @Test
        @DisplayName("Should honor user-provided statusChangedAt when status changes (backdating support)")
        void shouldHonorUserProvidedStatusChangedAtWhenStatusChanges() {
            // Given: User wants to backdate a status change (e.g., recording a call
            // they received 10 days ago but forgot to log until now)
            Long applicationId = 1L;
            Long userId = 1L;
            Instant backdatedStatusChange = Instant.now().minus(Duration.ofDays(10));

            JobApplication existingApplication = JobApplicationFixture.aJobApplication()
                .withId(applicationId)
                .withUser(testUser)
                .withStatus(ApplicationStatus.APPLIED)
                .withStatusChangedAt(Instant.now().minus(Duration.ofDays(20)))
                .build();

            // Request changes status AND provides an explicit statusChangedAt value
            // The statusChangedAt should be HONORED to support backdating scenarios
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withStatus(ApplicationStatus.RECRUITER_SCREEN)
                .withStatusChangedAt(backdatedStatusChange)
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(existingApplication));

            doAnswer(invocation -> {
                JobApplication app = invocation.getArgument(1);
                JobApplicationUpdateRequest req = invocation.getArgument(0);
                app.setStatus(ApplicationStatus.RECRUITER_SCREEN);
                app.setCompanyName(req.companyName());
                app.setPositionTitle(req.positionTitle());
                app.setStatusChangedAt(req.statusChangedAt());
                return null;
            }).when(updateMapper).applyTo(eq(request), any(JobApplication.class));

            when(repository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            jobApplicationService.updateApplication(applicationId, request, userId);

            // Then
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();

            // statusChangedAt should use the user-provided value to support backdating
            assertThat(savedApplication.getStatusChangedAt()).isEqualTo(backdatedStatusChange);
        }

        /**
         * BUG REPRODUCTION TEST: This test demonstrates the reported issue where
         * explicitly provided appliedDate and statusChangedAt values are not persisted
         * when updating a job application.
         *
         * <p>Scenario: User sends a PUT request with:
         * - appliedDate = "2024-01-15T10:00:00Z"
         * - statusChangedAt = "2024-02-01T10:00:00Z"
         * - status = TECH_SCREEN (same as existing)
         *
         * <p>Expected: Both dates should be saved exactly as provided.
         * Actual: The dates may not persist due to logic issues in updateApplication().
         */
        @Test
        @DisplayName("BUG: Should persist explicit appliedDate and statusChangedAt from PUT request")
        void shouldPersistExplicitDatesFromPutRequest_BugReproduction() {
            // Given: A specific scenario matching the reported bug
            Long applicationId = 1L;
            Long userId = 1L;

            // These are the exact dates the user wants to set via PUT request
            Instant requestedAppliedDate = Instant.parse("2024-01-15T10:00:00Z");
            Instant requestedStatusChangedAt = Instant.parse("2024-02-01T10:00:00Z");

            // Existing application has different dates
            Instant originalAppliedDate = Instant.parse("2024-03-01T10:00:00Z");
            Instant originalStatusChangedAt = Instant.parse("2024-03-15T10:00:00Z");

            JobApplication existingApplication = JobApplicationFixture.aJobApplication()
                .withId(applicationId)
                .withUser(testUser)
                .withStatus(ApplicationStatus.TECH_SCREEN)  // Same status as request
                .withAppliedDate(originalAppliedDate)
                .withStatusChangedAt(originalStatusChangedAt)
                .build();

            // User sends PUT request with explicit dates - status stays the same
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withStatus(ApplicationStatus.TECH_SCREEN)  // Same status - no auto-update
                .withAppliedDate(requestedAppliedDate)
                .withStatusChangedAt(requestedStatusChangedAt)
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(existingApplication));

            // Simulate ModelMapper behavior - it SHOULD map the dates from request
            doAnswer(invocation -> {
                JobApplication app = invocation.getArgument(1);
                JobApplicationUpdateRequest req = invocation.getArgument(0);
                app.setStatus(req.status());
                app.setCompanyName(req.companyName());
                app.setPositionTitle(req.positionTitle());
                // ModelMapper would map these if properly configured
                app.setAppliedDate(req.appliedDate());
                app.setStatusChangedAt(req.statusChangedAt());
                return null;
            }).when(updateMapper).applyTo(eq(request), any(JobApplication.class));

            when(repository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            jobApplicationService.updateApplication(applicationId, request, userId);

            // Then: The EXACT dates from the request should be persisted
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();

            // These assertions verify the bug is fixed - dates should match request exactly
            assertThat(savedApplication.getAppliedDate())
                .as("appliedDate should be set to the exact value from PUT request")
                .isEqualTo(requestedAppliedDate);

            assertThat(savedApplication.getStatusChangedAt())
                .as("statusChangedAt should be set to the exact value from PUT request (status unchanged)")
                .isEqualTo(requestedStatusChangedAt);
        }

        /**
         * Tests that when status DOES change, the user should still be able to
         * provide a custom statusChangedAt date (e.g., for backdating when they
         * forgot to update the application earlier).
         *
         * CURRENT BEHAVIOR: statusChangedAt is ALWAYS set to Instant.now() when status changes.
         * EXPECTED BEHAVIOR (per user report): User-provided statusChangedAt should be honored.
         */
        @Test
        @DisplayName("BUG: Should honor user-provided statusChangedAt even when status changes")
        void shouldHonorUserProvidedStatusChangedAtWhenStatusChanges_BugReproduction() {
            // Given: User wants to backdate a status change
            Long applicationId = 1L;
            Long userId = 1L;

            // User wants to record that they got the interview call 2 weeks ago
            Instant backdatedStatusChange = Instant.parse("2024-02-01T10:00:00Z");

            JobApplication existingApplication = JobApplicationFixture.aJobApplication()
                .withId(applicationId)
                .withUser(testUser)
                .withStatus(ApplicationStatus.APPLIED)
                .withAppliedDate(Instant.parse("2024-01-15T10:00:00Z"))
                .withStatusChangedAt(Instant.parse("2024-01-15T10:00:00Z"))
                .build();

            // User changes status from APPLIED to TECH_SCREEN with a backdated statusChangedAt
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withStatus(ApplicationStatus.TECH_SCREEN)  // Status IS changing
                .withAppliedDate(Instant.parse("2024-01-15T10:00:00Z"))
                .withStatusChangedAt(backdatedStatusChange)  // User wants this specific date
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(existingApplication));

            doAnswer(invocation -> {
                JobApplication app = invocation.getArgument(1);
                JobApplicationUpdateRequest req = invocation.getArgument(0);
                app.setStatus(req.status());
                app.setCompanyName(req.companyName());
                app.setPositionTitle(req.positionTitle());
                app.setAppliedDate(req.appliedDate());
                app.setStatusChangedAt(req.statusChangedAt());
                return null;
            }).when(updateMapper).applyTo(eq(request), any(JobApplication.class));

            when(repository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            jobApplicationService.updateApplication(applicationId, request, userId);

            // Then
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();

            // BUG: Currently this FAILS because the service always sets Instant.now()
            // when status changes, ignoring the user-provided value
            assertThat(savedApplication.getStatusChangedAt())
                .as("User-provided statusChangedAt should be honored even when status changes")
                .isEqualTo(backdatedStatusChange);
        }
    }

    @Nested
    @DisplayName("Bulk Delete All Applications Tests")
    class DeleteAllApplicationsTests {

        @Test
        @DisplayName("Should return the number of applications deleted")
        void shouldReturnNumberOfApplicationsDeleted() {
            // Given
            Long userId = 1L;
            when(repository.countByUserId(userId)).thenReturn(7L);

            // When
            int deletedCount = jobApplicationService.deleteAllApplications(userId);

            // Then
            assertThat(deletedCount).isEqualTo(7);
        }

        @Test
        @DisplayName("Should delete events before applications to respect the foreign key")
        void shouldDeleteEventsBeforeApplications() {
            // Given
            Long userId = 1L;
            when(repository.countByUserId(userId)).thenReturn(3L);

            // When
            jobApplicationService.deleteAllApplications(userId);

            // Then
            InOrder deletionOrder = inOrder(eventRepository, repository);
            deletionOrder.verify(eventRepository).deleteAllByUserId(userId);
            deletionOrder.verify(repository).deleteAllByUserId(userId);
        }

        @Test
        @DisplayName("Should return zero when the user has no applications")
        void shouldReturnZeroWhenUserHasNoApplications() {
            // Given
            Long userId = 1L;
            when(repository.countByUserId(userId)).thenReturn(0L);

            // When
            int deletedCount = jobApplicationService.deleteAllApplications(userId);

            // Then
            assertThat(deletedCount).isZero();
        }

        @Test
        @DisplayName("Should count applications before deleting them")
        void shouldCountApplicationsBeforeDeletingThem() {
            // Given
            Long userId = 1L;
            when(repository.countByUserId(userId)).thenReturn(5L);

            // When
            jobApplicationService.deleteAllApplications(userId);

            // Then
            InOrder countThenDelete = inOrder(repository);
            countThenDelete.verify(repository).countByUserId(userId);
            countThenDelete.verify(repository).deleteAllByUserId(userId);
        }
    }

    @Nested
    @DisplayName("Bulk Delete Non-Active Applications Tests")
    class DeleteNonActiveApplicationsTests {

        @Test
        @DisplayName("Should return the number of non-active applications deleted")
        void shouldReturnNumberOfNonActiveApplicationsDeleted() {
            // Given
            Long userId = 1L;
            when(repository.findIdsByUserIdAndStatusIn(eq(userId), any()))
                .thenReturn(List.of(10L, 11L, 12L));

            // When
            int deletedCount = jobApplicationService.deleteNonActiveApplications(userId);

            // Then
            assertThat(deletedCount).isEqualTo(3);
        }

        @Test
        @DisplayName("Should delete events before applications to respect the foreign key")
        void shouldDeleteEventsBeforeApplications() {
            // Given
            Long userId = 1L;
            List<Long> nonActiveIds = List.of(10L, 11L);
            when(repository.findIdsByUserIdAndStatusIn(eq(userId), any())).thenReturn(nonActiveIds);

            // When
            jobApplicationService.deleteNonActiveApplications(userId);

            // Then
            InOrder deletionOrder = inOrder(eventRepository, repository);
            deletionOrder.verify(eventRepository).deleteAllByApplicationIdIn(nonActiveIds);
            deletionOrder.verify(repository).deleteAllByIdIn(nonActiveIds);
        }

        @Test
        @DisplayName("Should target only REJECTED, WITHDRAWN and GHOSTED applications")
        void shouldTargetOnlyNonActiveStatuses() {
            // Given
            Long userId = 1L;
            when(repository.findIdsByUserIdAndStatusIn(eq(userId), statusSetCaptor.capture()))
                .thenReturn(List.of(10L));

            // When
            jobApplicationService.deleteNonActiveApplications(userId);

            // Then
            assertThat(statusSetCaptor.getValue()).containsExactlyInAnyOrder(
                ApplicationStatus.REJECTED,
                ApplicationStatus.WITHDRAWN,
                ApplicationStatus.GHOSTED);
        }

        @Test
        @DisplayName("Should return zero when no non-active applications exist")
        void shouldReturnZeroWhenNoNonActiveApplicationsExist() {
            // Given
            Long userId = 1L;
            when(repository.findIdsByUserIdAndStatusIn(eq(userId), any())).thenReturn(List.of());

            // When
            int deletedCount = jobApplicationService.deleteNonActiveApplications(userId);

            // Then
            assertThat(deletedCount).isZero();
        }

        @Test
        @DisplayName("Should skip deletion entirely when no non-active applications exist")
        void shouldSkipDeletionWhenNoNonActiveApplicationsExist() {
            // Given
            // An empty ID list would produce an invalid "IN ()" clause, so the
            // service must not reach the delete queries at all.
            Long userId = 1L;
            when(repository.findIdsByUserIdAndStatusIn(eq(userId), any())).thenReturn(List.of());

            // When
            jobApplicationService.deleteNonActiveApplications(userId);

            // Then
            verify(eventRepository, never()).deleteAllByApplicationIdIn(any());
            verify(repository, never()).deleteAllByIdIn(any());
        }
    }

    @Nested
    @DisplayName("Count Non-Active Applications Tests")
    class CountNonActiveApplicationsTests {

        @Test
        @DisplayName("Should return the count of non-active applications")
        void shouldReturnCountOfNonActiveApplications() {
            // Given
            Long userId = 1L;
            when(repository.countByUserIdAndStatusIn(eq(userId), any())).thenReturn(4L);

            // When
            long count = jobApplicationService.countNonActiveApplications(userId);

            // Then
            assertThat(count).isEqualTo(4L);
        }

        @Test
        @DisplayName("Should count only REJECTED, WITHDRAWN and GHOSTED applications")
        void shouldCountOnlyNonActiveStatuses() {
            // Given
            Long userId = 1L;
            when(repository.countByUserIdAndStatusIn(eq(userId), statusSetCaptor.capture()))
                .thenReturn(0L);

            // When
            jobApplicationService.countNonActiveApplications(userId);

            // Then
            assertThat(statusSetCaptor.getValue()).containsExactlyInAnyOrder(
                ApplicationStatus.REJECTED,
                ApplicationStatus.WITHDRAWN,
                ApplicationStatus.GHOSTED);
        }
    }
}