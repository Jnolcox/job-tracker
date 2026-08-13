package com.nolcox.jobtracking.application.controller;

import java.time.DayOfWeek;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.ActivityHeatmapResponse;
import com.nolcox.jobtracking.application.dto.response.ApplicationEventResponse;
import com.nolcox.jobtracking.application.dto.response.BulkDeleteResponse;
import com.nolcox.jobtracking.application.dto.response.CompanyInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.CompanyInsightsResponse.CompanyMetrics;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.application.dto.response.LocationInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.LocationInsightsResponse.LocationMetrics;
import com.nolcox.jobtracking.application.dto.response.LocationInsightsResponse.RtoMetrics;
import com.nolcox.jobtracking.application.dto.response.MetricsResponse;
import com.nolcox.jobtracking.application.dto.response.MetricsResponse.StageConversions;
import com.nolcox.jobtracking.application.dto.response.PositionInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.PositionInsightsResponse.LevelMetrics;
import com.nolcox.jobtracking.application.dto.response.SalaryDistributionResponse;
import com.nolcox.jobtracking.application.dto.response.StageDurationsResponse;
import com.nolcox.jobtracking.application.dto.response.StageDurationsResponse.BottleneckStage;
import com.nolcox.jobtracking.application.dto.response.TimePatternsResponse;
import com.nolcox.jobtracking.application.service.AnalyticsService;
import com.nolcox.jobtracking.application.service.ApplicationEventService;
import com.nolcox.jobtracking.application.service.JobApplicationService;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.EventType;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.fixtures.ApplicationEventFixture;
import com.nolcox.jobtracking.fixtures.JobApplicationFixture;
import com.nolcox.jobtracking.fixtures.JobApplicationRequestFixture;
import com.nolcox.jobtracking.fixtures.UserFixture;
import com.nolcox.jobtracking.shared.exception.BusinessException;
import com.nolcox.jobtracking.shared.exception.ResourceNotFoundException;
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;

@ExtendWith(MockitoExtension.class)
@DisplayName("JobApplicationController Tests")
class JobApplicationControllerTest {

    @Mock
    private JobApplicationService applicationService;

    @Mock
    private ApplicationEventService eventService;

    @Mock
    private AnalyticsService analyticsService;

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

    @Nested
    @DisplayName("Get All User Events Tests")
    class GetAllUserEventsTests {

        @Test
        @DisplayName("Should return all events for current user's applications")
        void shouldReturnAllEventsForCurrentUserApplications() {
            // Given
            List<ApplicationEventResponse> events = List.of(
                    ApplicationEventFixture.statusChangedEvent()
                            .withId(3L)
                            .withCreatedAt(Instant.now())
                            .buildResponse(),
                    ApplicationEventFixture.applicationCreatedEvent()
                            .withId(2L)
                            .withCreatedAt(Instant.now().minusSeconds(3600))
                            .buildResponse(),
                    ApplicationEventFixture.applicationCreatedEvent()
                            .withId(1L)
                            .withCreatedAt(Instant.now().minusSeconds(86400))
                            .buildResponse()
            );

            when(eventService.getAllEventsForUser(testUser.getId()))
                    .thenReturn(events);

            // When
            ResponseEntity<List<ApplicationEventResponse>> response =
                    jobApplicationController.getAllEventsForUser(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).hasSize(3);
            assertThat(response.getBody().get(0).id()).isEqualTo(3L);
            assertThat(response.getBody().get(1).id()).isEqualTo(2L);
            assertThat(response.getBody().get(2).id()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should return empty list when user has no events")
        void shouldReturnEmptyListWhenUserHasNoEvents() {
            // Given
            when(eventService.getAllEventsForUser(testUser.getId()))
                    .thenReturn(List.of());

            // When
            ResponseEntity<List<ApplicationEventResponse>> response =
                    jobApplicationController.getAllEventsForUser(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Application Events Tests")
    class GetApplicationEventsTests {

        @Test
        @DisplayName("Should return events for authorized user's application")
        void shouldReturnEventsForAuthorizedUserApplication() {
            // Given
            Long applicationId = 1L;
            List<ApplicationEventResponse> events = List.of(
                    ApplicationEventFixture.statusChangedEvent()
                            .withId(2L)
                            .withCreatedAt(Instant.now())
                            .buildResponse(),
                    ApplicationEventFixture.applicationCreatedEvent()
                            .withId(1L)
                            .withCreatedAt(Instant.now().minusSeconds(3600))
                            .buildResponse()
            );

            when(eventService.getEventsForApplication(applicationId, testUser.getId()))
                    .thenReturn(events);

            // When
            ResponseEntity<List<ApplicationEventResponse>> response =
                    jobApplicationController.getApplicationEvents(applicationId, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).hasSize(2);
            assertThat(response.getBody().get(0).eventType()).isEqualTo(EventType.STATUS_CHANGED);
            assertThat(response.getBody().get(1).eventType()).isEqualTo(EventType.APPLICATION_CREATED);
        }

        @Test
        @DisplayName("Should return empty list when no events exist")
        void shouldReturnEmptyListWhenNoEventsExist() {
            // Given
            Long applicationId = 1L;

            when(eventService.getEventsForApplication(applicationId, testUser.getId()))
                    .thenReturn(List.of());

            // When
            ResponseEntity<List<ApplicationEventResponse>> response =
                    jobApplicationController.getApplicationEvents(applicationId, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).isEmpty();
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when application not found")
        void shouldThrowResourceNotFoundExceptionWhenApplicationNotFound() {
            // Given
            Long applicationId = 999L;

            when(eventService.getEventsForApplication(applicationId, testUser.getId()))
                    .thenThrow(new ResourceNotFoundException("Application not found"));

            // When & Then
            assertThatThrownBy(() -> jobApplicationController.getApplicationEvents(applicationId, authentication))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Application not found");
        }

        @Test
        @DisplayName("Should throw UnauthorizedException when user not authorized")
        void shouldThrowUnauthorizedExceptionWhenUserNotAuthorized() {
            // Given
            Long applicationId = 1L;

            when(eventService.getEventsForApplication(applicationId, testUser.getId()))
                    .thenThrow(new UnauthorizedException("Access denied"));

            // When & Then
            assertThatThrownBy(() -> jobApplicationController.getApplicationEvents(applicationId, authentication))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessage("Access denied");
        }
    }

    // ==================== Analytics Endpoint Tests ====================

    @Nested
    @DisplayName("Get Metrics Tests")
    class GetMetricsTests {

        @Test
        @DisplayName("Should return metrics with 200 OK")
        void shouldReturnMetricsWith200() {
            // Given
            MetricsResponse expectedMetrics = new MetricsResponse(
                    45.5, 30.0, 5.0, 7.5, 3.2, 100L,
                    new StageConversions(40.0, 75.0, 20.0)
            );

            when(analyticsService.getMetrics(testUser.getId())).thenReturn(expectedMetrics);

            // When
            ResponseEntity<MetricsResponse> response = jobApplicationController.getMetrics(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().trueResponseRate()).isEqualTo(45.5);
            assertThat(response.getBody().trueInterviewRate()).isEqualTo(30.0);
            assertThat(response.getBody().trueOfferRate()).isEqualTo(5.0);
            assertThat(response.getBody().totalApplications()).isEqualTo(100L);
        }
    }

    @Nested
    @DisplayName("Get Counts By Status Tests")
    class GetCountsByStatusTests {

        @Test
        @DisplayName("Should return counts by status with 200 OK")
        void shouldReturnCountsByStatusWith200() {
            // Given
            Map<ApplicationStatus, Long> expectedCounts = new EnumMap<>(ApplicationStatus.class);
            expectedCounts.put(ApplicationStatus.APPLIED, 25L);
            expectedCounts.put(ApplicationStatus.RECRUITER_SCREEN, 15L);
            expectedCounts.put(ApplicationStatus.REJECTED, 30L);

            when(analyticsService.getCountsByStatus(testUser.getId())).thenReturn(expectedCounts);

            // When
            ResponseEntity<Map<ApplicationStatus, Long>> response =
                    jobApplicationController.getCountsByStatus(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).containsEntry(ApplicationStatus.APPLIED, 25L);
            assertThat(response.getBody()).containsEntry(ApplicationStatus.REJECTED, 30L);
        }
    }

    @Nested
    @DisplayName("Get Salary Distribution Tests")
    class GetSalaryDistributionTests {

        @Test
        @DisplayName("Should return salary distribution with 200 OK")
        void shouldReturnSalaryDistributionWith200() {
            // Given
            SalaryDistributionResponse expectedDistribution = new SalaryDistributionResponse(
                    80000.0, 250000.0, 120000.0, 180000.0, 150000.0, 45L,
                    List.of()
            );

            when(analyticsService.getSalaryDistribution(testUser.getId())).thenReturn(expectedDistribution);

            // When
            ResponseEntity<SalaryDistributionResponse> response =
                    jobApplicationController.getSalaryDistribution(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().globalMin()).isEqualTo(80000.0);
            assertThat(response.getBody().globalMax()).isEqualTo(250000.0);
            assertThat(response.getBody().activeAppsWithSalary()).isEqualTo(45L);
        }
    }

    @Nested
    @DisplayName("Get Activity Heatmap Tests")
    class GetActivityHeatmapTests {

        @Test
        @DisplayName("Should return activity heatmap for specified year")
        void shouldReturnActivityHeatmapForSpecifiedYear() {
            // Given
            Map<String, Integer> data = new TreeMap<>();
            data.put("2026-01-15", 3);
            data.put("2026-01-16", 1);
            ActivityHeatmapResponse expectedHeatmap = new ActivityHeatmapResponse(data, 3, 2026);

            when(analyticsService.getActivityHeatmap(testUser.getId(), 2026)).thenReturn(expectedHeatmap);

            // When
            ResponseEntity<ActivityHeatmapResponse> response =
                    jobApplicationController.getActivityHeatmap(2026, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().data()).containsEntry("2026-01-15", 3);
            assertThat(response.getBody().maxCount()).isEqualTo(3);
            assertThat(response.getBody().year()).isEqualTo(2026);
        }

        @Test
        @DisplayName("Should default to current year when not specified")
        void shouldDefaultToCurrentYearWhenNotSpecified() {
            // Given
            int currentYear = java.time.Year.now().getValue();
            ActivityHeatmapResponse expectedHeatmap = new ActivityHeatmapResponse(Map.of(), 0, currentYear);

            when(analyticsService.getActivityHeatmap(testUser.getId(), currentYear)).thenReturn(expectedHeatmap);

            // When
            ResponseEntity<ActivityHeatmapResponse> response =
                    jobApplicationController.getActivityHeatmap(null, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().year()).isEqualTo(currentYear);
        }
    }

    @Nested
    @DisplayName("Get Time Patterns Tests")
    class GetTimePatternsTests {

        @Test
        @DisplayName("Should return time patterns with 200 OK")
        void shouldReturnTimePatternsWithOK() {
            // Given
            Map<DayOfWeek, Integer> byDayOfWeek = new EnumMap<>(DayOfWeek.class);
            byDayOfWeek.put(DayOfWeek.MONDAY, 12);
            byDayOfWeek.put(DayOfWeek.TUESDAY, 8);
            Map<Integer, Integer> byHour = new TreeMap<>();
            byHour.put(9, 15);
            byHour.put(10, 20);
            TimePatternsResponse expectedPatterns = new TimePatternsResponse(byDayOfWeek, byHour);

            when(analyticsService.getTimePatterns(testUser.getId())).thenReturn(expectedPatterns);

            // When
            ResponseEntity<TimePatternsResponse> response =
                    jobApplicationController.getTimePatterns(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().byDayOfWeek()).containsEntry(DayOfWeek.MONDAY, 12);
            assertThat(response.getBody().byHour()).containsEntry(9, 15);
        }
    }

    @Nested
    @DisplayName("Get Stage Durations Tests")
    class GetStageDurationsTests {

        @Test
        @DisplayName("Should return stage durations with 200 OK")
        void shouldReturnStageDurationsWithOK() {
            // Given
            Map<ApplicationStatus, Double> averageTimeByStage = new EnumMap<>(ApplicationStatus.class);
            averageTimeByStage.put(ApplicationStatus.APPLIED, 5.2);
            averageTimeByStage.put(ApplicationStatus.TECH_SCREEN, 7.5);
            List<BottleneckStage> bottlenecks = List.of(
                    new BottleneckStage(ApplicationStatus.TECH_SCREEN, 7.5),
                    new BottleneckStage(ApplicationStatus.APPLIED, 5.2)
            );
            StageDurationsResponse expectedDurations =
                    new StageDurationsResponse(averageTimeByStage, bottlenecks);

            when(analyticsService.getStageDurations(testUser.getId())).thenReturn(expectedDurations);

            // When
            ResponseEntity<StageDurationsResponse> response =
                    jobApplicationController.getStageDurations(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().averageTimeByStage())
                    .containsEntry(ApplicationStatus.TECH_SCREEN, 7.5);
            assertThat(response.getBody().bottleneckStages()).hasSize(2);
            assertThat(response.getBody().bottleneckStages().get(0).stage())
                    .isEqualTo(ApplicationStatus.TECH_SCREEN);
        }
    }

    // ==================== Data Fusion Analytics Endpoint Tests ====================

    @Nested
    @DisplayName("Get Company Insights Tests")
    class GetCompanyInsightsTests {

        @Test
        @DisplayName("Should return company insights with 200 OK")
        void shouldReturnCompanyInsightsWith200OK() {
            // Given
            List<CompanyMetrics> companies = List.of(
                    new CompanyMetrics("Google", 5L, 60.0, 20.0, 40.0, 7.5),
                    new CompanyMetrics("Meta", 3L, 66.7, 0.0, 66.7, 5.0)
            );
            CompanyInsightsResponse expectedResponse = new CompanyInsightsResponse(companies, 2, 8L);

            when(analyticsService.getCompanyInsights(testUser.getId(), 10)).thenReturn(expectedResponse);

            // When
            ResponseEntity<CompanyInsightsResponse> response =
                    jobApplicationController.getCompanyInsights(10, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().totalCompaniesAnalyzed()).isEqualTo(2);
            assertThat(response.getBody().totalApplicationsAnalyzed()).isEqualTo(8L);
            assertThat(response.getBody().companies()).hasSize(2);
            assertThat(response.getBody().companies().get(0).companyName()).isEqualTo("Google");
        }

        @Test
        @DisplayName("Should accept custom topN parameter")
        void shouldAcceptCustomTopNParameter() {
            // Given
            List<CompanyMetrics> companies = List.of(
                    new CompanyMetrics("TopCompany", 10L, 70.0, 10.0, 50.0, 5.0)
            );
            CompanyInsightsResponse expectedResponse = new CompanyInsightsResponse(companies, 1, 10L);
            when(analyticsService.getCompanyInsights(testUser.getId(), 5)).thenReturn(expectedResponse);

            // When: Request top 5 companies
            ResponseEntity<CompanyInsightsResponse> response =
                    jobApplicationController.getCompanyInsights(5, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().companies()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Get Location Insights Tests")
    class GetLocationInsightsTests {

        @Test
        @DisplayName("Should return location insights with 200 OK")
        void shouldReturnLocationInsightsWith200OK() {
            // Given
            List<LocationMetrics> byLocation = List.of(
                    new LocationMetrics("San Francisco, CA", 5L, 150000.0, 200000.0, 20.0),
                    new LocationMetrics("New York, NY", 3L, 140000.0, 190000.0, 33.3)
            );
            List<RtoMetrics> byRtoType = List.of(
                    new RtoMetrics("REMOTE", 4L, 50.0, 145000.0, 195000.0, 25.0),
                    new RtoMetrics("HYBRID_3", 2L, 25.0, 150000.0, 200000.0, 50.0)
            );
            LocationInsightsResponse expectedResponse = new LocationInsightsResponse(byLocation, byRtoType, 8L);

            when(analyticsService.getLocationInsights(testUser.getId())).thenReturn(expectedResponse);

            // When
            ResponseEntity<LocationInsightsResponse> response =
                    jobApplicationController.getLocationInsights(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().totalApplicationsAnalyzed()).isEqualTo(8L);
            assertThat(response.getBody().byLocation()).hasSize(2);
            assertThat(response.getBody().byRtoType()).hasSize(2);
            assertThat(response.getBody().byLocation().get(0).location()).isEqualTo("San Francisco, CA");
        }
    }

    @Nested
    @DisplayName("Get Position Insights Tests")
    class GetPositionInsightsTests {

        @Test
        @DisplayName("Should return position insights with 200 OK")
        void shouldReturnPositionInsightsWith200OK() {
            // Given
            List<LevelMetrics> byLevel = List.of(
                    new LevelMetrics("SENIOR", 5L, 62.5, 20.0, 60.0, 150000.0, 200000.0),
                    new LevelMetrics("MID", 2L, 25.0, 0.0, 50.0, 100000.0, 140000.0),
                    new LevelMetrics("JUNIOR", 1L, 12.5, 0.0, 0.0, 80000.0, 100000.0)
            );
            PositionInsightsResponse expectedResponse = new PositionInsightsResponse(byLevel, 8L);

            when(analyticsService.getPositionInsights(testUser.getId())).thenReturn(expectedResponse);

            // When
            ResponseEntity<PositionInsightsResponse> response =
                    jobApplicationController.getPositionInsights(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().totalApplicationsAnalyzed()).isEqualTo(8L);
            assertThat(response.getBody().byLevel()).hasSize(3);
            assertThat(response.getBody().byLevel().get(0).level()).isEqualTo("SENIOR");
            assertThat(response.getBody().byLevel().get(0).percentage()).isEqualTo(62.5);
        }
    }

    @Nested
    @DisplayName("Bulk Delete All Applications Tests")
    class DeleteAllApplicationsTests {

        @Test
        @DisplayName("Should return 200 with the number of applications deleted")
        void shouldReturnDeletedCount() {
            // Given
            when(applicationService.deleteAllApplications(testUser.getId())).thenReturn(12);

            // When
            ResponseEntity<BulkDeleteResponse> response =
                    jobApplicationController.deleteAllApplications(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().deletedCount()).isEqualTo(12);
        }

        @Test
        @DisplayName("Should include the deleted count in the message")
        void shouldIncludeDeletedCountInMessage() {
            // Given
            when(applicationService.deleteAllApplications(testUser.getId())).thenReturn(12);

            // When
            ResponseEntity<BulkDeleteResponse> response =
                    jobApplicationController.deleteAllApplications(authentication);

            // Then
            assertThat(response.getBody().message()).contains("12");
        }

        @Test
        @DisplayName("Should delete only the authenticated user's applications")
        void shouldDeleteOnlyAuthenticatedUsersApplications() {
            // Given
            when(applicationService.deleteAllApplications(testUser.getId())).thenReturn(1);

            // When
            jobApplicationController.deleteAllApplications(authentication);

            // Then
            verify(applicationService).deleteAllApplications(testUser.getId());
        }

        @Test
        @DisplayName("Should return zero when the user has no applications")
        void shouldReturnZeroWhenUserHasNoApplications() {
            // Given
            when(applicationService.deleteAllApplications(testUser.getId())).thenReturn(0);

            // When
            ResponseEntity<BulkDeleteResponse> response =
                    jobApplicationController.deleteAllApplications(authentication);

            // Then
            assertThat(response.getBody().deletedCount()).isZero();
        }
    }

    @Nested
    @DisplayName("Bulk Delete Non-Active Applications Tests")
    class DeleteNonActiveApplicationsTests {

        @Test
        @DisplayName("Should return 200 with the number of applications deleted")
        void shouldReturnDeletedCount() {
            // Given
            when(applicationService.deleteNonActiveApplications(testUser.getId())).thenReturn(5);

            // When
            ResponseEntity<BulkDeleteResponse> response =
                    jobApplicationController.deleteNonActiveApplications(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().deletedCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should describe the deletion as non-active in the message")
        void shouldDescribeDeletionAsNonActiveInMessage() {
            // Given
            when(applicationService.deleteNonActiveApplications(testUser.getId())).thenReturn(5);

            // When
            ResponseEntity<BulkDeleteResponse> response =
                    jobApplicationController.deleteNonActiveApplications(authentication);

            // Then
            assertThat(response.getBody().message()).contains("5").contains("non-active");
        }

        @Test
        @DisplayName("Should delete only the authenticated user's applications")
        void shouldDeleteOnlyAuthenticatedUsersApplications() {
            // Given
            when(applicationService.deleteNonActiveApplications(testUser.getId())).thenReturn(1);

            // When
            jobApplicationController.deleteNonActiveApplications(authentication);

            // Then
            verify(applicationService).deleteNonActiveApplications(testUser.getId());
        }

        @Test
        @DisplayName("Should return zero when no non-active applications exist")
        void shouldReturnZeroWhenNoNonActiveApplicationsExist() {
            // Given
            when(applicationService.deleteNonActiveApplications(testUser.getId())).thenReturn(0);

            // When
            ResponseEntity<BulkDeleteResponse> response =
                    jobApplicationController.deleteNonActiveApplications(authentication);

            // Then
            assertThat(response.getBody().deletedCount()).isZero();
        }
    }

    @Nested
    @DisplayName("Count Non-Active Applications Tests")
    class CountNonActiveApplicationsTests {

        @Test
        @DisplayName("Should return 200 with the count keyed by 'count'")
        void shouldReturnCountKeyedByCount() {
            // Given
            when(applicationService.countNonActiveApplications(testUser.getId())).thenReturn(9L);

            // When
            ResponseEntity<Map<String, Long>> response =
                    jobApplicationController.countNonActiveApplications(authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).containsEntry("count", 9L);
        }

        @Test
        @DisplayName("Should count only the authenticated user's applications")
        void shouldCountOnlyAuthenticatedUsersApplications() {
            // Given
            when(applicationService.countNonActiveApplications(testUser.getId())).thenReturn(0L);

            // When
            jobApplicationController.countNonActiveApplications(authentication);

            // Then
            verify(applicationService).countNonActiveApplications(testUser.getId());
        }

        @Test
        @DisplayName("Should return zero when no non-active applications exist")
        void shouldReturnZeroWhenNoNonActiveApplicationsExist() {
            // Given
            when(applicationService.countNonActiveApplications(testUser.getId())).thenReturn(0L);

            // When
            ResponseEntity<Map<String, Long>> response =
                    jobApplicationController.countNonActiveApplications(authentication);

            // Then
            assertThat(response.getBody()).containsEntry("count", 0L);
        }
    }
}