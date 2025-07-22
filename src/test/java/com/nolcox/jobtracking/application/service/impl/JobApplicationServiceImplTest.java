package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import com.nolcox.jobtracking.fixtures.JobApplicationFixture;
import com.nolcox.jobtracking.fixtures.JobApplicationRequestFixture;
import com.nolcox.jobtracking.fixtures.UserFixture;
import com.nolcox.jobtracking.shared.exception.ResourceNotFoundException;
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JobApplicationService Tests")
class JobApplicationServiceImplTest {

    @Mock
    private JobApplicationRepository repository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private JobApplicationServiceImpl jobApplicationService;

    private User testUser;
    private User otherUser;
    private JobApplication testApplication;
    private JobApplicationResponse testResponse;

    @BeforeEach
    void setUp() {
        testUser = UserFixture.aUser()
            .withId(1L)
            .withEmail("test@example.com")
            .build();

        otherUser = UserFixture.aUser()
            .withId(2L)
            .withEmail("other@example.com")
            .build();

        testApplication = JobApplicationFixture.aJobApplication()
            .withId(1L)
            .withUser(testUser)
            .withCompanyName("Tech Corp")
            .withPositionTitle("Software Engineer")
            .build();

        testResponse = new JobApplicationResponse(
            1L,
            "Tech Corp",
            "Software Engineer",
            "Job description",
            ApplicationStatus.APPLIED,
            LocalDateTime.now(),
            null,
            new BigDecimal("120000"),
            "Notes",
            "https://example.com/job",
            "Contact Name",
            "contact@example.com",
            "+1-555-0123",
            LocalDateTime.now(),
            LocalDateTime.now()
        );
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
            when(modelMapper.map(testApplication, JobApplicationResponse.class))
                .thenReturn(testResponse);

            // When
            Page<JobApplicationResponse> result = jobApplicationService
                .getUserApplications(userId, null, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0)).isEqualTo(testResponse);
            assertThat(result.getTotalElements()).isEqualTo(1);

            verify(repository).findByUserIdWithFilters(userId, null, null, pageable);
        }

        @Test
        @DisplayName("Should get user applications with status filter")
        void shouldGetUserApplicationsWithStatusFilter() {
            // Given
            Long userId = 1L;
            ApplicationStatus status = ApplicationStatus.INTERVIEW_SCHEDULED;
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

        @Test
        @DisplayName("Should get user applications with company name filter")
        void shouldGetUserApplicationsWithCompanyNameFilter() {
            // Given
            Long userId = 1L;
            String companyName = "Tech Corp";
            Pageable pageable = PageRequest.of(0, 10);

            when(repository.findByUserIdWithFilters(userId, null, companyName, pageable))
                .thenReturn(Page.empty());

            // When
            Page<JobApplicationResponse> result = jobApplicationService
                .getUserApplications(userId, null, companyName, pageable);

            // Then
            verify(repository).findByUserIdWithFilters(userId, null, companyName, pageable);
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
            when(modelMapper.map(testApplication, JobApplicationResponse.class))
                .thenReturn(testResponse);

            // When
            JobApplicationResponse result = jobApplicationService
                .getApplication(applicationId, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result).isEqualTo(testResponse);

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
            verify(modelMapper, never()).map(any(), any());
        }

        @Test
        @DisplayName("Should throw UnauthorizedException for unauthorized access")
        void shouldThrowUnauthorizedExceptionForUnauthorizedAccess() {
            // Given
            Long applicationId = 1L;
            Long userId = 2L; // Different user

            when(repository.findById(applicationId)).thenReturn(Optional.of(testApplication));

            // When & Then
            assertThatThrownBy(() -> jobApplicationService.getApplication(applicationId, userId))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Access denied");

            verify(repository).findById(applicationId);
            verify(modelMapper, never()).map(any(), any());
        }
    }

    @Nested
    @DisplayName("Create Application Tests")
    class CreateApplicationTests {

        @Test
        @DisplayName("Should create application successfully")
        void shouldCreateApplicationSuccessfully() {
            // Given
            Long userId = 1L;
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withCompanyName("New Tech Corp")
                .withPositionTitle("Senior Developer")
                .buildCreateRequest();

            JobApplication createdApplication = JobApplicationFixture.aJobApplication()
                .withId(2L)
                .withUser(testUser)
                .withCompanyName("New Tech Corp")
                .withPositionTitle("Senior Developer")
                .build();

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(modelMapper.map(request, JobApplication.class)).thenReturn(createdApplication);
            when(repository.save(any(JobApplication.class))).thenReturn(createdApplication);
            when(modelMapper.map(createdApplication, JobApplicationResponse.class))
                .thenReturn(testResponse);

            // When
            JobApplicationResponse result = jobApplicationService
                .createApplication(request, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result).isEqualTo(testResponse);

            ArgumentCaptor<JobApplication> applicationCaptor = ArgumentCaptor.forClass(JobApplication.class);
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();
            assertThat(savedApplication.getUser()).isEqualTo(testUser);
            assertThat(savedApplication.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
            assertThat(savedApplication.getAppliedDate()).isNotNull();
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void shouldThrowResourceNotFoundExceptionWhenUserNotFound() {
            // Given
            Long userId = 999L;
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .buildCreateRequest();

            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> jobApplicationService.createApplication(request, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");

            verify(userRepository).findById(userId);
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should set default values during creation")
        void shouldSetDefaultValuesDuringCreation() {
            // Given
            Long userId = 1L;
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .buildCreateRequest();

            JobApplication mappedApplication = new JobApplication();
            
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(modelMapper.map(request, JobApplication.class)).thenReturn(mappedApplication);
            when(repository.save(any(JobApplication.class))).thenAnswer(invocation -> {
                JobApplication app = invocation.getArgument(0);
                app.setId(1L);
                return app;
            });
            when(modelMapper.map(any(JobApplication.class), eq(JobApplicationResponse.class)))
                .thenReturn(testResponse);

            // When
            jobApplicationService.createApplication(request, userId);

            // Then
            ArgumentCaptor<JobApplication> applicationCaptor = ArgumentCaptor.forClass(JobApplication.class);
            verify(repository).save(applicationCaptor.capture());
            JobApplication savedApplication = applicationCaptor.getValue();
            assertThat(savedApplication.getUser()).isEqualTo(testUser);
            assertThat(savedApplication.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
            assertThat(savedApplication.getAppliedDate()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Update Application Tests")
    class UpdateApplicationTests {

        @Test
        @DisplayName("Should update application successfully")
        void shouldUpdateApplicationSuccessfully() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                .withCompanyName("Updated Corp")
                .buildUpdateRequest();

            when(repository.findById(applicationId)).thenReturn(Optional.of(testApplication));
            doNothing().when(modelMapper).map(any(JobApplicationUpdateRequest.class), any(JobApplication.class));
            when(repository.save(testApplication)).thenReturn(testApplication);
            when(modelMapper.map(any(JobApplication.class), eq(JobApplicationResponse.class)))
                .thenReturn(testResponse);

            // When
            JobApplicationResponse result = jobApplicationService
                .updateApplication(applicationId, request, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result).isEqualTo(testResponse);

            verify(repository).findById(applicationId);
            verify(modelMapper).map(request, testApplication);
            verify(repository).save(testApplication);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when application not found for update")
        void shouldThrowResourceNotFoundExceptionWhenApplicationNotFoundForUpdate() {
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
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw UnauthorizedException when updating unauthorized application")
        void shouldThrowUnauthorizedExceptionWhenUpdatingUnauthorizedApplication() {
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
            verify(repository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Delete Application Tests")
    class DeleteApplicationTests {

        @Test
        @DisplayName("Should delete application successfully")
        void shouldDeleteApplicationSuccessfully() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;

            when(repository.findById(applicationId)).thenReturn(Optional.of(testApplication));

            // When
            jobApplicationService.deleteApplication(applicationId, userId);

            // Then
            verify(repository).findById(applicationId);
            verify(repository).delete(eq(testApplication));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when application not found for delete")
        void shouldThrowResourceNotFoundExceptionWhenApplicationNotFoundForDelete() {
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
        @DisplayName("Should throw UnauthorizedException when deleting unauthorized application")
        void shouldThrowUnauthorizedExceptionWhenDeletingUnauthorizedApplication() {
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
    @DisplayName("Additional Service Methods Tests")
    class AdditionalServiceMethodsTests {

        @Test
        @DisplayName("Should get application statistics")
        void shouldGetApplicationStatistics() {
            // Given
            Long userId = 1L;
            Map<ApplicationStatus, Long> expectedStats = Map.of(
                ApplicationStatus.APPLIED, 5L,
                ApplicationStatus.INTERVIEW_SCHEDULED, 2L,
                ApplicationStatus.REJECTED, 3L
            );

            when(repository.countByStatusForUser(userId)).thenReturn(expectedStats);

            // When
            Map<ApplicationStatus, Long> result = jobApplicationService
                .getApplicationStatistics(userId);

            // Then
            assertThat(result).isEqualTo(expectedStats);
            verify(repository).countByStatusForUser(userId);
        }

        @Test
        @DisplayName("Should get applications by status")
        void shouldGetApplicationsByStatus() {
            // Given
            Long userId = 1L;
            ApplicationStatus status = ApplicationStatus.APPLIED;
            Pageable pageable = PageRequest.of(0, 10);
            Page<JobApplication> applicationPage = new PageImpl<>(List.of(testApplication));

            when(repository.findByUserIdAndStatus(userId, status, pageable))
                .thenReturn(applicationPage);
            when(modelMapper.map(testApplication, JobApplicationResponse.class))
                .thenReturn(testResponse);

            // When
            Page<JobApplicationResponse> result = jobApplicationService
                .getApplicationsByStatus(userId, status, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(repository).findByUserIdAndStatus(userId, status, pageable);
        }

        @Test
        @DisplayName("Should search applications")
        void shouldSearchApplications() {
            // Given
            Long userId = 1L;
            String searchTerm = "Tech";
            ApplicationStatus status = ApplicationStatus.APPLIED;
            Pageable pageable = PageRequest.of(0, 10);

            when(repository.searchApplications(userId, searchTerm, status, pageable))
                .thenReturn(Page.empty());

            // When
            Page<JobApplicationResponse> result = jobApplicationService
                .searchApplications(userId, searchTerm, status, pageable);

            // Then
            assertThat(result).isNotNull();
            verify(repository).searchApplications(userId, searchTerm, status, pageable);
        }

        @Test
        @DisplayName("Should update application status")
        void shouldUpdateApplicationStatus() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;
            ApplicationStatus newStatus = ApplicationStatus.INTERVIEW_SCHEDULED;

            when(repository.findById(applicationId)).thenReturn(Optional.of(testApplication));
            when(repository.save(testApplication)).thenReturn(testApplication);
            when(modelMapper.map(any(JobApplication.class), eq(JobApplicationResponse.class)))
                .thenReturn(testResponse);

            // When
            JobApplicationResponse result = jobApplicationService
                .updateApplicationStatus(applicationId, newStatus, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(testApplication.getStatus()).isEqualTo(newStatus);
            verify(repository).save(testApplication);
        }

        @Test
        @DisplayName("Should throw UnauthorizedException when updating status for unauthorized application")
        void shouldThrowUnauthorizedExceptionWhenUpdatingStatusForUnauthorizedApplication() {
            // Given
            Long applicationId = 1L;
            Long userId = 2L; // Different user
            ApplicationStatus newStatus = ApplicationStatus.REJECTED;

            when(repository.findById(applicationId)).thenReturn(Optional.of(testApplication));

            // When & Then
            assertThatThrownBy(() -> jobApplicationService
                .updateApplicationStatus(applicationId, newStatus, userId))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Access denied");

            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should get recent user applications")
        void shouldGetRecentUserApplications() {
            // Given
            Long userId = 1L;
            int limit = 5;
            List<JobApplication> applications = List.of(testApplication);

            when(repository.findRecentApplicationsByUserId(userId, limit))
                .thenReturn(applications);
            when(modelMapper.map(testApplication, JobApplicationResponse.class))
                .thenReturn(testResponse);

            // When
            List<JobApplicationResponse> result = jobApplicationService
                .getUserApplications(userId, limit);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0)).isEqualTo(testResponse);
            verify(repository).findRecentApplicationsByUserId(userId, limit);
        }
    }
}