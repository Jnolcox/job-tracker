package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import com.nolcox.jobtracking.fixtures.JobApplicationFixture;
import com.nolcox.jobtracking.fixtures.UserFixture;
import com.nolcox.jobtracking.shared.exception.ResourceNotFoundException;
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.ArgumentMatchers.any;

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
}