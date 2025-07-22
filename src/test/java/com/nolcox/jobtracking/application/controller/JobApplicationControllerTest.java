package com.nolcox.jobtracking.application.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(JobApplicationController.class)
@DisplayName("JobApplicationController Tests")
class JobApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JobApplicationService applicationService;

    private final User mockUser = UserFixture.aUser().build();
    private final Authentication mockAuthentication = new MockAuthentication(mockUser);

    @Nested
    @DisplayName("Get All Applications Endpoint Tests")
    class GetAllApplicationsTests {

        @Test
        @WithMockUser
        @DisplayName("Should get all applications successfully")
        void shouldGetAllApplicationsSuccessfully() throws Exception {
            // Given
            JobApplicationResponse app1 = JobApplicationFixture.aJobApplication().buildResponse();
            JobApplicationResponse app2 = JobApplicationFixture.aJobApplication()
                    .withId(2L)
                    .withCompanyName("Company B")
                    .buildResponse();
            
            Page<JobApplicationResponse> page = new PageImpl<>(
                    List.of(app1, app2),
                    PageRequest.of(0, 10),
                    2
            );

            when(applicationService.getUserApplications(eq(1L), isNull(), isNull(), any(Pageable.class)))
                    .thenReturn(page);

            // When & Then
            mockMvc.perform(get("/v1/job-applications")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content.length()").value(2))
                    .andExpect(jsonPath("$.content[0].id").value(1))
                    .andExpect(jsonPath("$.content[0].companyName").value("Test Company"))
                    .andExpect(jsonPath("$.content[1].id").value(2))
                    .andExpect(jsonPath("$.content[1].companyName").value("Company B"))
                    .andExpect(jsonPath("$.totalElements").value(2))
                    .andExpect(jsonPath("$.size").value(10))
                    .andExpect(jsonPath("$.number").value(0));
        }

        @Test
        @WithMockUser
        @DisplayName("Should filter by application status")
        void shouldFilterByApplicationStatus() throws Exception {
            // Given
            JobApplicationResponse app = JobApplicationFixture.aJobApplication()
                    .withStatus(ApplicationStatus.INTERVIEW_SCHEDULED)
                    .buildResponse();
            
            Page<JobApplicationResponse> page = new PageImpl<>(
                    List.of(app),
                    PageRequest.of(0, 10),
                    1
            );

            when(applicationService.getUserApplications(eq(1L), eq(ApplicationStatus.INTERVIEW_SCHEDULED), isNull(), any(Pageable.class)))
                    .thenReturn(page);

            // When & Then
            mockMvc.perform(get("/v1/job-applications")
                            .param("status", "INTERVIEW_SCHEDULED")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].status").value("INTERVIEW_SCHEDULED"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should filter by company name")
        void shouldFilterByCompanyName() throws Exception {
            // Given
            JobApplicationResponse app = JobApplicationFixture.aJobApplication()
                    .withCompanyName("Specific Company")
                    .buildResponse();
            
            Page<JobApplicationResponse> page = new PageImpl<>(
                    List.of(app),
                    PageRequest.of(0, 10),
                    1
            );

            when(applicationService.getUserApplications(eq(1L), isNull(), eq("Specific Company"), any(Pageable.class)))
                    .thenReturn(page);

            // When & Then
            mockMvc.perform(get("/v1/job-applications")
                            .param("companyName", "Specific Company")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].companyName").value("Specific Company"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should handle pagination parameters")
        void shouldHandlePaginationParameters() throws Exception {
            // Given
            Page<JobApplicationResponse> page = new PageImpl<>(
                    List.of(),
                    PageRequest.of(1, 5),
                    0
            );

            when(applicationService.getUserApplications(eq(1L), isNull(), isNull(), any(Pageable.class)))
                    .thenReturn(page);

            // When & Then
            mockMvc.perform(get("/v1/job-applications")
                            .param("page", "1")
                            .param("size", "5")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.number").value(1))
                    .andExpect(jsonPath("$.size").value(5));
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            // When & Then
            mockMvc.perform(get("/v1/job-applications"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Get Application by ID Endpoint Tests")
    class GetApplicationByIdTests {

        @Test
        @WithMockUser
        @DisplayName("Should get application by ID successfully")
        void shouldGetApplicationByIdSuccessfully() throws Exception {
            // Given
            JobApplicationResponse app = JobApplicationFixture.aJobApplication().buildResponse();
            when(applicationService.getApplication(1L, 1L)).thenReturn(app);

            // When & Then
            mockMvc.perform(get("/v1/job-applications/1")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.companyName").value("Test Company"))
                    .andExpect(jsonPath("$.positionTitle").value("Software Engineer"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 404 when application not found")
        void shouldReturn404WhenApplicationNotFound() throws Exception {
            // Given
            when(applicationService.getApplication(999L, 1L))
                    .thenThrow(new BusinessException("Application not found"));

            // When & Then
            mockMvc.perform(get("/v1/job-applications/999")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isNotFound())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Application not found"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 403 when trying to access other user's application")
        void shouldReturn403WhenTryingToAccessOtherUsersApplication() throws Exception {
            // Given
            when(applicationService.getApplication(1L, 1L))
                    .thenThrow(new BusinessException("Access denied"));

            // When & Then
            mockMvc.perform(get("/v1/job-applications/1")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isForbidden())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Access denied"));
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            // When & Then
            mockMvc.perform(get("/v1/job-applications/1"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 400 when ID is invalid")
        void shouldReturn400WhenIdIsInvalid() throws Exception {
            // When & Then
            mockMvc.perform(get("/v1/job-applications/invalid")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Create Application Endpoint Tests")
    class CreateApplicationTests {

        @Test
        @WithMockUser
        @DisplayName("Should create application successfully with valid request")
        void shouldCreateApplicationWithValidRequest() throws Exception {
            // Given
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .buildCreateRequest();
            JobApplicationResponse response = JobApplicationFixture.aJobApplication().buildResponse();

            when(applicationService.createApplication(any(JobApplicationCreateRequest.class), eq(1L)))
                    .thenReturn(response);

            // When & Then
            mockMvc.perform(post("/v1/job-applications")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("/v1/job-applications/1")))
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.companyName").value("Test Company"))
                    .andExpect(jsonPath("$.positionTitle").value("Software Engineer"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 400 when company name is blank")
        void shouldReturn400WhenCompanyNameIsBlank() throws Exception {
            // Given
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .withCompanyName("")
                    .buildCreateRequest();

            // When & Then
            mockMvc.perform(post("/v1/job-applications")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 400 when position title is blank")
        void shouldReturn400WhenPositionTitleIsBlank() throws Exception {
            // Given
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .withPositionTitle("")
                    .buildCreateRequest();

            // When & Then
            mockMvc.perform(post("/v1/job-applications")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 400 when contact email is invalid")
        void shouldReturn400WhenContactEmailIsInvalid() throws Exception {
            // Given
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .withContactEmail("invalid-email")
                    .buildCreateRequest();

            // When & Then
            mockMvc.perform(post("/v1/job-applications")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @WithMockUser
        @DisplayName("Should create application with minimum required fields")
        void shouldCreateApplicationWithMinimumRequiredFields() throws Exception {
            // Given
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .withJobDescription(null)
                    .withJobUrl(null)
                    .withSalaryExpectation((BigDecimal) null)
                    .withNotes(null)
                    .withContactName(null)
                    .withContactEmail(null)
                    .withContactPhone(null)
                    .buildCreateRequest();
            JobApplicationResponse response = JobApplicationFixture.aJobApplication().buildResponse();

            when(applicationService.createApplication(any(JobApplicationCreateRequest.class), eq(1L)))
                    .thenReturn(response);

            // When & Then
            mockMvc.perform(post("/v1/job-applications")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            // Given
            JobApplicationCreateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .buildCreateRequest();

            // When & Then
            mockMvc.perform(post("/v1/job-applications")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 400 when request body is empty")
        void shouldReturn400WhenRequestBodyIsEmpty() throws Exception {
            // When & Then
            mockMvc.perform(post("/v1/job-applications")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists());
        }
    }

    @Nested
    @DisplayName("Update Application Endpoint Tests")
    class UpdateApplicationTests {

        @Test
        @WithMockUser
        @DisplayName("Should update application successfully with valid request")
        void shouldUpdateApplicationWithValidRequest() throws Exception {
            // Given
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .buildUpdateRequest();
            JobApplicationResponse response = JobApplicationFixture.aJobApplication()
                    .withStatus(ApplicationStatus.INTERVIEW_SCHEDULED)
                    .buildResponse();

            when(applicationService.updateApplication(eq(1L), any(JobApplicationUpdateRequest.class), eq(1L)))
                    .thenReturn(response);

            // When & Then
            mockMvc.perform(put("/v1/job-applications/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.status").value("INTERVIEW_SCHEDULED"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 400 when company name is blank")
        void shouldReturn400WhenCompanyNameIsBlank() throws Exception {
            // Given
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .withCompanyName("")
                    .buildUpdateRequest();

            // When & Then
            mockMvc.perform(put("/v1/job-applications/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 400 when position title is blank")
        void shouldReturn400WhenPositionTitleIsBlank() throws Exception {
            // Given
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .withPositionTitle("")
                    .buildUpdateRequest();

            // When & Then
            mockMvc.perform(put("/v1/job-applications/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 400 when status is null")
        void shouldReturn400WhenStatusIsNull() throws Exception {
            // Given
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .withStatus(null)
                    .buildUpdateRequest();

            // When & Then
            mockMvc.perform(put("/v1/job-applications/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.errors").exists());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 404 when application not found")
        void shouldReturn404WhenApplicationNotFound() throws Exception {
            // Given
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .buildUpdateRequest();
            when(applicationService.updateApplication(eq(999L), any(JobApplicationUpdateRequest.class), eq(1L)))
                    .thenThrow(new BusinessException("Application not found"));

            // When & Then
            mockMvc.perform(put("/v1/job-applications/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isNotFound())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Application not found"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 403 when trying to update other user's application")
        void shouldReturn403WhenTryingToUpdateOtherUsersApplication() throws Exception {
            // Given
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .buildUpdateRequest();
            when(applicationService.updateApplication(eq(1L), any(JobApplicationUpdateRequest.class), eq(1L)))
                    .thenThrow(new BusinessException("Access denied"));

            // When & Then
            mockMvc.perform(put("/v1/job-applications/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isForbidden())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Access denied"));
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            // Given
            JobApplicationUpdateRequest request = JobApplicationRequestFixture.aJobApplicationRequest()
                    .buildUpdateRequest();

            // When & Then
            mockMvc.perform(put("/v1/job-applications/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Delete Application Endpoint Tests")
    class DeleteApplicationTests {

        @Test
        @WithMockUser
        @DisplayName("Should delete application successfully")
        void shouldDeleteApplicationSuccessfully() throws Exception {
            // When & Then
            mockMvc.perform(delete("/v1/job-applications/1")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isNoContent());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 404 when application not found")
        void shouldReturn404WhenApplicationNotFound() throws Exception {
            // Given
            doThrow(new BusinessException("Application not found"))
                    .when(applicationService).deleteApplication(999L, 1L);

            // When & Then
            mockMvc.perform(delete("/v1/job-applications/999")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isNotFound())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Application not found"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 403 when trying to delete other user's application")
        void shouldReturn403WhenTryingToDeleteOtherUsersApplication() throws Exception {
            // Given
            doThrow(new BusinessException("Access denied"))
                    .when(applicationService).deleteApplication(1L, 1L);

            // When & Then
            mockMvc.perform(delete("/v1/job-applications/1")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isForbidden())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Access denied"));
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            // When & Then
            mockMvc.perform(delete("/v1/job-applications/1"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 400 when ID is invalid")
        void shouldReturn400WhenIdIsInvalid() throws Exception {
            // When & Then
            mockMvc.perform(delete("/v1/job-applications/invalid")
                            .with(authentication(mockAuthentication)))
                    .andExpect(status().isBadRequest());
        }
    }

    // Mock Authentication class for testing
    private static class MockAuthentication implements Authentication {
        private final User principal;

        public MockAuthentication(User principal) {
            this.principal = principal;
        }

        @Override
        public Object getPrincipal() {
            return principal;
        }

        @Override
        public String getName() {
            return principal.getEmail();
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            return List.of();
        }

        @Override
        public Object getCredentials() {
            return null;
        }

        @Override
        public Object getDetails() {
            return null;
        }

        @Override
        public boolean isAuthenticated() {
            return true;
        }

        @Override
        public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
        }
    }
}