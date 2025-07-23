package com.nolcox.jobtracking.application.controller;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.application.service.JobApplicationService;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.fixtures.JobApplicationFixture;
import com.nolcox.jobtracking.fixtures.JobApplicationRequestFixture;
import com.nolcox.jobtracking.fixtures.UserFixture;
import com.nolcox.jobtracking.shared.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("JobApplicationController Tests")
class JobApplicationControllerTest {

    @Mock
    private JobApplicationService applicationService;

    @InjectMocks
    private JobApplicationController jobApplicationController;

    @Mock
    private Authentication authentication;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = UserFixture.aUser().build();
        when(authentication.getPrincipal()).thenReturn(testUser);
    }

    @Nested
    @DisplayName("Get All Applications Tests")
    class GetAllApplicationsTests {

        @Test
        @DisplayName("Should return paginated job applications")
        void shouldReturnPaginatedJobApplications() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            List<JobApplicationResponse> applications = List.of(
                    JobApplicationFixture.aJobApplication().buildResponse()
            );
            Page<JobApplicationResponse> page = new PageImpl<>(applications, pageable, 1);

            when(applicationService.getUserApplications(eq(testUser.getId()), any(), any(), eq(pageable)))
                    .thenReturn(page);

            // When
            ResponseEntity<Page<JobApplicationResponse>> response = 
                    jobApplicationController.getAllApplications(null, null, pageable, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getContent()).hasSize(1);
            assertThat(response.getBody().getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should filter applications by status")
        void shouldFilterApplicationsByStatus() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            ApplicationStatus status = ApplicationStatus.APPLIED;
            Page<JobApplicationResponse> page = new PageImpl<>(List.of(), pageable, 0);

            when(applicationService.getUserApplications(eq(testUser.getId()), eq(status), any(), eq(pageable)))
                    .thenReturn(page);

            // When
            ResponseEntity<Page<JobApplicationResponse>> response = 
                    jobApplicationController.getAllApplications(status, null, pageable, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Get Application By ID Tests")
    class GetApplicationByIdTests {

        @Test
        @DisplayName("Should return application when found")
        void shouldReturnApplicationWhenFound() {
            // Given
            Long applicationId = 1L;
            JobApplicationResponse expectedResponse = JobApplicationFixture.aJobApplication().buildResponse();

            when(applicationService.getApplication(applicationId, testUser.getId()))
                    .thenReturn(expectedResponse);

            // When
            ResponseEntity<JobApplicationResponse> response = 
                    jobApplicationController.getApplication(applicationId, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isEqualTo(expectedResponse);
        }

        @Test
        @DisplayName("Should handle application not found")
        void shouldHandleApplicationNotFound() {
            // Given
            Long applicationId = 999L;
            when(applicationService.getApplication(applicationId, testUser.getId()))
                    .thenThrow(new BusinessException("Application not found"));

            // When & Then
            assertThatThrownBy(() -> jobApplicationController.getApplication(applicationId, authentication))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("Application not found");
        }
    }

    @Nested
    @DisplayName("Create Application Tests")
    class CreateApplicationTests {

        @Test
        @DisplayName("Should create application with valid request")
        void shouldCreateApplicationWithValidRequest() {
            // Given
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest().buildCreateRequest();
            JobApplicationResponse expectedResponse = JobApplicationFixture.aJobApplication().buildResponse();

            when(applicationService.createApplication(request, testUser.getId()))
                    .thenReturn(expectedResponse);

            // When
            ResponseEntity<JobApplicationResponse> response = 
                    jobApplicationController.createApplication(request, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(201);
            assertThat(response.getBody()).isEqualTo(expectedResponse);
        }

        @Test
        @DisplayName("Should create application with minimum required fields")
        void shouldCreateApplicationWithMinimumRequiredFields() {
            // Given
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .withCompanyName("Test Company")
                    .withPositionTitle("Developer")
                    .buildCreateRequest();
            JobApplicationResponse expectedResponse = JobApplicationFixture.aJobApplication().buildResponse();

            when(applicationService.createApplication(request, testUser.getId()))
                    .thenReturn(expectedResponse);

            // When
            ResponseEntity<JobApplicationResponse> response = 
                    jobApplicationController.createApplication(request, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(201);
            assertThat(response.getBody()).isEqualTo(expectedResponse);
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
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest().buildUpdateRequest();
            JobApplicationResponse expectedResponse = JobApplicationFixture.aJobApplication().buildResponse();

            when(applicationService.updateApplication(applicationId, request, testUser.getId()))
                    .thenReturn(expectedResponse);

            // When
            ResponseEntity<JobApplicationResponse> response = 
                    jobApplicationController.updateApplication(applicationId, request, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isEqualTo(expectedResponse);
        }

        @Test
        @DisplayName("Should handle update failure")
        void shouldHandleUpdateFailure() {
            // Given
            Long applicationId = 1L;
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest().buildUpdateRequest();

            when(applicationService.updateApplication(applicationId, request, testUser.getId()))
                    .thenThrow(new BusinessException("Cannot update application"));

            // When & Then
            assertThatThrownBy(() -> jobApplicationController.updateApplication(applicationId, request, authentication))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("Cannot update application");
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

            // When
            ResponseEntity<Void> response = 
                    jobApplicationController.deleteApplication(applicationId, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(204);
            assertThat(response.getBody()).isNull();
        }

        @Test
        @DisplayName("Should handle delete failure")
        void shouldHandleDeleteFailure() {
            // Given
            Long applicationId = 1L;
            doThrow(new BusinessException("Cannot delete application"))
                    .when(applicationService).deleteApplication(applicationId, testUser.getId());

            // When & Then
            assertThatThrownBy(() -> jobApplicationController.deleteApplication(applicationId, authentication))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("Cannot delete application");
        }
    }
}