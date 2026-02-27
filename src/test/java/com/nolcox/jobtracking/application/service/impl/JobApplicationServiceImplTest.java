package com.nolcox.jobtracking.application.service.impl;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doAnswer;
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
    private ModelMapper modelMapper;

    @InjectMocks
    private JobApplicationServiceImpl jobApplicationService;

    @Captor
    private ArgumentCaptor<JobApplication> applicationCaptor;

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
        @DisplayName("Should auto-update statusChangedAt when status changes even if request contains old value")
        void shouldAutoUpdateStatusChangedAtWhenStatusChanges() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;
            Instant oldStatusChangedAt = Instant.now().minus(Duration.ofDays(5));

            JobApplication existingApplication = JobApplicationFixture.aJobApplication()
                .withId(applicationId)
                .withUser(testUser)
                .withStatus(ApplicationStatus.APPLIED)
                .withStatusChangedAt(oldStatusChangedAt)
                .build();

            // Request changes status from APPLIED to TECH_SCREEN but includes old statusChangedAt
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withStatus(ApplicationStatus.TECH_SCREEN)
                .withStatusChangedAt(oldStatusChangedAt)
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(existingApplication));

            // Mock modelMapper to update the application's status
            doAnswer(invocation -> {
                JobApplication app = invocation.getArgument(1);
                app.setStatus(ApplicationStatus.TECH_SCREEN);
                app.setCompanyName(request.companyName());
                app.setPositionTitle(request.positionTitle());
                return null;
            }).when(modelMapper).map(eq(request), any(JobApplication.class));

            when(repository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Instant beforeUpdate = Instant.now();

            // When
            jobApplicationService.updateApplication(applicationId, request, userId);

            // Then
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();

            // statusChangedAt should be auto-updated to current time, not the old value from request
            assertThat(savedApplication.getStatusChangedAt()).isAfterOrEqualTo(beforeUpdate);
            assertThat(savedApplication.getStatusChangedAt()).isNotEqualTo(oldStatusChangedAt);
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
            }).when(modelMapper).map(eq(request), any(JobApplication.class));

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
            }).when(modelMapper).map(eq(request), any(JobApplication.class));

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
    }
}