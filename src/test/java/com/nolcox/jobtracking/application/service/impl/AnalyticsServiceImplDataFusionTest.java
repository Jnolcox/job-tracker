package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.response.CompanyInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.LocationInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.PositionInsightsResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.Level;
import com.nolcox.jobtracking.domain.entity.RtoType;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.ApplicationEventRepository;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.fixtures.JobApplicationFixture;
import com.nolcox.jobtracking.fixtures.UserFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.Mockito.when;

/**
 * Unit tests for data-fusion analytics features in AnalyticsServiceImpl.
 *
 * <p>Tests cover company insights, location insights, and position insights
 * analytics endpoints following TDD principles.</p>
 *
 * <p>Each test section covers:
 * - Happy path scenarios with representative data
 * - Edge cases (null values, empty data)
 * - Boundary conditions (topN limiting, percentage calculations)</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Data Fusion Analytics Tests")
class AnalyticsServiceImplDataFusionTest {

    @Mock
    private JobApplicationRepository jobApplicationRepository;

    @Mock
    private ApplicationEventRepository eventRepository;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    private User testUser;
    private static final Long USER_ID = 1L;

    @BeforeEach
    void setUp() {
        testUser = UserFixture.aUser()
                .withId(USER_ID)
                .withEmail("test@example.com")
                .build();
    }

    // ==================== Company Insights Tests ====================

    @Nested
    @DisplayName("Get Company Insights Tests")
    class GetCompanyInsightsTests {

        @Test
        @DisplayName("Should return correct metrics for multiple companies")
        void shouldReturnCorrectMetricsForMultipleCompanies() {
            // Given: Applications to 3 companies with different outcomes
            List<JobApplication> applications = Arrays.asList(
                    // Google: 3 apps - 1 REJECTED (response), 1 GHOSTED, 1 RECRUITER_SCREEN
                    createAppWithCompanyAndStatus("Google", ApplicationStatus.REJECTED),
                    createAppWithCompanyAndStatus("Google", ApplicationStatus.GHOSTED),
                    createAppWithCompanyAndStatus("Google", ApplicationStatus.RECRUITER_SCREEN),
                    // Meta: 2 apps - 1 OFFER_RECEIVED, 1 TECH_SCREEN
                    createAppWithCompanyAndStatus("Meta", ApplicationStatus.OFFER_RECEIVED),
                    createAppWithCompanyAndStatus("Meta", ApplicationStatus.TECH_SCREEN),
                    // Amazon: 1 app - APPLIED (no response yet)
                    createAppWithCompanyAndStatus("Amazon", ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            CompanyInsightsResponse result = analyticsService.getCompanyInsights(USER_ID, 10);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.totalCompaniesAnalyzed()).isEqualTo(3);
            assertThat(result.totalApplicationsAnalyzed()).isEqualTo(6L);
            assertThat(result.companies()).hasSize(3);

            // Companies should be sorted by application count descending
            assertThat(result.companies().get(0).companyName()).isEqualTo("Google");
            assertThat(result.companies().get(0).applicationCount()).isEqualTo(3L);
        }

        @Test
        @DisplayName("Should calculate correct response rate per company")
        void shouldCalculateCorrectResponseRatePerCompany() {
            // Given: 4 applications to same company
            // 2 with responses (RECRUITER_SCREEN, REJECTED), 1 GHOSTED, 1 APPLIED
            // Response rate = 2/4 = 50%
            List<JobApplication> applications = Arrays.asList(
                    createAppWithCompanyAndStatus("TestCo", ApplicationStatus.RECRUITER_SCREEN),
                    createAppWithCompanyAndStatus("TestCo", ApplicationStatus.REJECTED),
                    createAppWithCompanyAndStatus("TestCo", ApplicationStatus.GHOSTED),
                    createAppWithCompanyAndStatus("TestCo", ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            CompanyInsightsResponse result = analyticsService.getCompanyInsights(USER_ID, 10);

            // Then
            assertThat(result.companies()).hasSize(1);
            // RECRUITER_SCREEN and REJECTED are in RESPONSE_STATUSES
            // GHOSTED is not a response, APPLIED is not a response
            assertThat(result.companies().get(0).responseRate()).isCloseTo(50.0, within(0.1));
        }

        @Test
        @DisplayName("Should calculate correct ghost rate per company")
        void shouldCalculateCorrectGhostRatePerCompany() {
            // Given: 5 applications, 2 ghosted = 40% ghost rate
            List<JobApplication> applications = Arrays.asList(
                    createAppWithCompanyAndStatus("GhostCo", ApplicationStatus.GHOSTED),
                    createAppWithCompanyAndStatus("GhostCo", ApplicationStatus.GHOSTED),
                    createAppWithCompanyAndStatus("GhostCo", ApplicationStatus.REJECTED),
                    createAppWithCompanyAndStatus("GhostCo", ApplicationStatus.RECRUITER_SCREEN),
                    createAppWithCompanyAndStatus("GhostCo", ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            CompanyInsightsResponse result = analyticsService.getCompanyInsights(USER_ID, 10);

            // Then
            assertThat(result.companies()).hasSize(1);
            assertThat(result.companies().get(0).ghostRate()).isCloseTo(40.0, within(0.1));
        }

        @Test
        @DisplayName("Should calculate correct interview rate per company")
        void shouldCalculateCorrectInterviewRatePerCompany() {
            // Given: 4 applications, 2 reached interview stage (RECRUITER_SCREEN, TECH_SCREEN)
            List<JobApplication> applications = Arrays.asList(
                    createAppWithCompanyAndStatus("InterviewCo", ApplicationStatus.RECRUITER_SCREEN),
                    createAppWithCompanyAndStatus("InterviewCo", ApplicationStatus.TECH_SCREEN),
                    createAppWithCompanyAndStatus("InterviewCo", ApplicationStatus.REJECTED),
                    createAppWithCompanyAndStatus("InterviewCo", ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            CompanyInsightsResponse result = analyticsService.getCompanyInsights(USER_ID, 10);

            // Then: Interview rate = 2/4 = 50%
            assertThat(result.companies()).hasSize(1);
            assertThat(result.companies().get(0).interviewRate()).isCloseTo(50.0, within(0.1));
        }

        @Test
        @DisplayName("Should calculate average days to response correctly")
        void shouldCalculateAverageDaysToResponseCorrectly() {
            // Given: Applications with response dates
            Instant now = Instant.now();
            JobApplication app1 = createAppWithCompanyStatusAndDates("ResponseCo",
                    ApplicationStatus.RECRUITER_SCREEN,
                    now.minus(10, ChronoUnit.DAYS),  // applied
                    now.minus(5, ChronoUnit.DAYS));  // responded after 5 days

            JobApplication app2 = createAppWithCompanyStatusAndDates("ResponseCo",
                    ApplicationStatus.REJECTED,
                    now.minus(20, ChronoUnit.DAYS),  // applied
                    now.minus(10, ChronoUnit.DAYS)); // responded after 10 days

            // This one has no response (still in APPLIED)
            JobApplication app3 = createAppWithCompanyStatusAndDates("ResponseCo",
                    ApplicationStatus.APPLIED,
                    now.minus(3, ChronoUnit.DAYS),
                    now.minus(3, ChronoUnit.DAYS));

            List<JobApplication> applications = Arrays.asList(app1, app2, app3);
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            CompanyInsightsResponse result = analyticsService.getCompanyInsights(USER_ID, 10);

            // Then: Average of (5 + 10) / 2 = 7.5 days (only count responded apps)
            assertThat(result.companies()).hasSize(1);
            assertThat(result.companies().get(0).avgDaysToResponse()).isNotNull();
            assertThat(result.companies().get(0).avgDaysToResponse()).isCloseTo(7.5, within(0.1));
        }

        @Test
        @DisplayName("Should limit results to topN companies")
        void shouldLimitResultsToTopNCompanies() {
            // Given: 5 companies, but topN = 3
            List<JobApplication> applications = Arrays.asList(
                    createAppWithCompanyAndStatus("Company1", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("Company1", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("Company1", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("Company1", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("Company1", ApplicationStatus.APPLIED), // 5 apps
                    createAppWithCompanyAndStatus("Company2", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("Company2", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("Company2", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("Company2", ApplicationStatus.APPLIED), // 4 apps
                    createAppWithCompanyAndStatus("Company3", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("Company3", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("Company3", ApplicationStatus.APPLIED), // 3 apps
                    createAppWithCompanyAndStatus("Company4", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("Company4", ApplicationStatus.APPLIED), // 2 apps
                    createAppWithCompanyAndStatus("Company5", ApplicationStatus.APPLIED)  // 1 app
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When: Request only top 3
            CompanyInsightsResponse result = analyticsService.getCompanyInsights(USER_ID, 3);

            // Then: Should only return top 3 by application count
            assertThat(result.companies()).hasSize(3);
            assertThat(result.companies().get(0).companyName()).isEqualTo("Company1");
            assertThat(result.companies().get(0).applicationCount()).isEqualTo(5L);
            assertThat(result.companies().get(1).companyName()).isEqualTo("Company2");
            assertThat(result.companies().get(2).companyName()).isEqualTo("Company3");
            // But totalCompaniesAnalyzed should still reflect actual unique companies
            assertThat(result.totalCompaniesAnalyzed()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should use default topN of 10 when null is passed")
        void shouldUseDefaultTopNWhenNullPassed() {
            // Given: 15 companies
            List<JobApplication> applications = new java.util.ArrayList<>();
            for (int i = 1; i <= 15; i++) {
                applications.add(createAppWithCompanyAndStatus("Company" + i, ApplicationStatus.APPLIED));
            }
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When: Pass null for topN
            CompanyInsightsResponse result = analyticsService.getCompanyInsights(USER_ID, null);

            // Then: Should default to 10 companies
            assertThat(result.companies()).hasSize(10);
        }

        @Test
        @DisplayName("Should return empty response when no applications exist")
        void shouldReturnEmptyResponseWhenNoApplications() {
            // Given
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(Collections.emptyList());

            // When
            CompanyInsightsResponse result = analyticsService.getCompanyInsights(USER_ID, 10);

            // Then
            assertThat(result.companies()).isEmpty();
            assertThat(result.totalCompaniesAnalyzed()).isEqualTo(0);
            assertThat(result.totalApplicationsAnalyzed()).isEqualTo(0L);
        }

        @Test
        @DisplayName("Should return null avgDaysToResponse when no applications have responses")
        void shouldReturnNullAvgDaysToResponseWhenNoResponses() {
            // Given: All applications in APPLIED status (no responses)
            List<JobApplication> applications = Arrays.asList(
                    createAppWithCompanyAndStatus("NoResponse", ApplicationStatus.APPLIED),
                    createAppWithCompanyAndStatus("NoResponse", ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            CompanyInsightsResponse result = analyticsService.getCompanyInsights(USER_ID, 10);

            // Then
            assertThat(result.companies()).hasSize(1);
            assertThat(result.companies().get(0).avgDaysToResponse()).isNull();
        }
    }

    // ==================== Location Insights Tests ====================

    @Nested
    @DisplayName("Get Location Insights Tests")
    class GetLocationInsightsTests {

        @Test
        @DisplayName("Should group applications by location correctly")
        void shouldGroupApplicationsByLocationCorrectly() {
            // Given
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLocation("San Francisco, CA", ApplicationStatus.APPLIED),
                    createAppWithLocation("San Francisco, CA", ApplicationStatus.RECRUITER_SCREEN),
                    createAppWithLocation("San Francisco, CA", ApplicationStatus.OFFER_RECEIVED),
                    createAppWithLocation("New York, NY", ApplicationStatus.APPLIED),
                    createAppWithLocation("New York, NY", ApplicationStatus.REJECTED),
                    createAppWithLocation("Seattle, WA", ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            LocationInsightsResponse result = analyticsService.getLocationInsights(USER_ID);

            // Then
            assertThat(result.totalApplicationsAnalyzed()).isEqualTo(6L);
            assertThat(result.byLocation()).hasSize(3);

            var sfMetrics = result.byLocation().stream()
                    .filter(l -> l.location().equals("San Francisco, CA"))
                    .findFirst();
            assertThat(sfMetrics).isPresent();
            assertThat(sfMetrics.get().applicationCount()).isEqualTo(3L);
        }

        @Test
        @DisplayName("Should handle null location as Not Specified")
        void shouldHandleNullLocationAsNotSpecified() {
            // Given
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLocation(null, ApplicationStatus.APPLIED),
                    createAppWithLocation(null, ApplicationStatus.APPLIED),
                    createAppWithLocation("Remote", ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            LocationInsightsResponse result = analyticsService.getLocationInsights(USER_ID);

            // Then
            var notSpecified = result.byLocation().stream()
                    .filter(l -> l.location().equals("Not Specified"))
                    .findFirst();
            assertThat(notSpecified).isPresent();
            assertThat(notSpecified.get().applicationCount()).isEqualTo(2L);
        }

        @Test
        @DisplayName("Should calculate success rate by location")
        void shouldCalculateSuccessRateByLocation() {
            // Given: SF has 1 offer out of 3 = 33.3%
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLocation("San Francisco, CA", ApplicationStatus.OFFER_RECEIVED),
                    createAppWithLocation("San Francisco, CA", ApplicationStatus.REJECTED),
                    createAppWithLocation("San Francisco, CA", ApplicationStatus.REJECTED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            LocationInsightsResponse result = analyticsService.getLocationInsights(USER_ID);

            // Then
            assertThat(result.byLocation()).hasSize(1);
            assertThat(result.byLocation().get(0).successRate()).isCloseTo(33.3, within(0.1));
        }

        @Test
        @DisplayName("Should calculate average salary by location")
        void shouldCalculateAverageSalaryByLocation() {
            // Given: Two apps in same location with salary data
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLocationAndSalary("San Francisco, CA", 100000.0, 150000.0),
                    createAppWithLocationAndSalary("San Francisco, CA", 120000.0, 180000.0),
                    createAppWithLocationAndSalary("San Francisco, CA", null, null)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            LocationInsightsResponse result = analyticsService.getLocationInsights(USER_ID);

            // Then: Average of (100000, 120000) = 110000 and (150000, 180000) = 165000
            assertThat(result.byLocation()).hasSize(1);
            assertThat(result.byLocation().get(0).avgSalaryMin()).isCloseTo(110000.0, within(0.1));
            assertThat(result.byLocation().get(0).avgSalaryMax()).isCloseTo(165000.0, within(0.1));
        }

        @Test
        @DisplayName("Should group applications by RTO type correctly")
        void shouldGroupApplicationsByRtoTypeCorrectly() {
            // Given
            List<JobApplication> applications = Arrays.asList(
                    createAppWithRtoType(RtoType.REMOTE, ApplicationStatus.APPLIED),
                    createAppWithRtoType(RtoType.REMOTE, ApplicationStatus.APPLIED),
                    createAppWithRtoType(RtoType.REMOTE, ApplicationStatus.OFFER_RECEIVED),
                    createAppWithRtoType(RtoType.HYBRID_3, ApplicationStatus.APPLIED),
                    createAppWithRtoType(RtoType.HYBRID_3, ApplicationStatus.REJECTED),
                    createAppWithRtoType(RtoType.ONSITE, ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            LocationInsightsResponse result = analyticsService.getLocationInsights(USER_ID);

            // Then
            assertThat(result.byRtoType()).hasSize(3);

            var remoteMetrics = result.byRtoType().stream()
                    .filter(r -> r.rtoType().equals("REMOTE"))
                    .findFirst();
            assertThat(remoteMetrics).isPresent();
            assertThat(remoteMetrics.get().applicationCount()).isEqualTo(3L);
            assertThat(remoteMetrics.get().percentage()).isCloseTo(50.0, within(0.1)); // 3/6 = 50%
            assertThat(remoteMetrics.get().successRate()).isCloseTo(33.3, within(0.1)); // 1/3 offers
        }

        @Test
        @DisplayName("Should handle null RTO type as Not Specified")
        void shouldHandleNullRtoTypeAsNotSpecified() {
            // Given
            List<JobApplication> applications = Arrays.asList(
                    createAppWithRtoType(null, ApplicationStatus.APPLIED),
                    createAppWithRtoType(null, ApplicationStatus.APPLIED),
                    createAppWithRtoType(RtoType.REMOTE, ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            LocationInsightsResponse result = analyticsService.getLocationInsights(USER_ID);

            // Then
            var notSpecified = result.byRtoType().stream()
                    .filter(r -> r.rtoType().equals("Not Specified"))
                    .findFirst();
            assertThat(notSpecified).isPresent();
            assertThat(notSpecified.get().applicationCount()).isEqualTo(2L);
        }

        @Test
        @DisplayName("Should return empty response when no applications exist")
        void shouldReturnEmptyResponseWhenNoApplications() {
            // Given
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(Collections.emptyList());

            // When
            LocationInsightsResponse result = analyticsService.getLocationInsights(USER_ID);

            // Then
            assertThat(result.byLocation()).isEmpty();
            assertThat(result.byRtoType()).isEmpty();
            assertThat(result.totalApplicationsAnalyzed()).isEqualTo(0L);
        }

        @Test
        @DisplayName("Should return null average salaries when no salary data exists")
        void shouldReturnNullAverageSalariesWhenNoSalaryData() {
            // Given: Applications without salary data
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLocation("San Francisco, CA", ApplicationStatus.APPLIED),
                    createAppWithLocation("San Francisco, CA", ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            LocationInsightsResponse result = analyticsService.getLocationInsights(USER_ID);

            // Then
            assertThat(result.byLocation()).hasSize(1);
            assertThat(result.byLocation().get(0).avgSalaryMin()).isNull();
            assertThat(result.byLocation().get(0).avgSalaryMax()).isNull();
        }
    }

    // ==================== Position Insights Tests ====================

    @Nested
    @DisplayName("Get Position Insights Tests")
    class GetPositionInsightsTests {

        @Test
        @DisplayName("Should group applications by Level enum correctly")
        void shouldGroupApplicationsByLevelEnumCorrectly() {
            // Given
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.APPLIED),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.RECRUITER_SCREEN),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.OFFER_RECEIVED),
                    createAppWithLevel(Level.MID, ApplicationStatus.APPLIED),
                    createAppWithLevel(Level.MID, ApplicationStatus.REJECTED),
                    createAppWithLevel(Level.JUNIOR, ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            PositionInsightsResponse result = analyticsService.getPositionInsights(USER_ID);

            // Then
            assertThat(result.totalApplicationsAnalyzed()).isEqualTo(6L);
            assertThat(result.byLevel()).hasSize(3);

            var seniorMetrics = result.byLevel().stream()
                    .filter(l -> l.level().equals("SENIOR"))
                    .findFirst();
            assertThat(seniorMetrics).isPresent();
            assertThat(seniorMetrics.get().applicationCount()).isEqualTo(3L);
        }

        @Test
        @DisplayName("Should handle null level as Not Specified")
        void shouldHandleNullLevelAsNotSpecified() {
            // Given
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLevel(null, ApplicationStatus.APPLIED),
                    createAppWithLevel(null, ApplicationStatus.APPLIED),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            PositionInsightsResponse result = analyticsService.getPositionInsights(USER_ID);

            // Then
            var notSpecified = result.byLevel().stream()
                    .filter(l -> l.level().equals("Not Specified"))
                    .findFirst();
            assertThat(notSpecified).isPresent();
            assertThat(notSpecified.get().applicationCount()).isEqualTo(2L);
        }

        @Test
        @DisplayName("Should calculate percentage of total applications per level")
        void shouldCalculatePercentagePerLevel() {
            // Given: 6 total apps, 3 SENIOR (50%), 2 MID (33.3%), 1 JUNIOR (16.7%)
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.APPLIED),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.APPLIED),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.APPLIED),
                    createAppWithLevel(Level.MID, ApplicationStatus.APPLIED),
                    createAppWithLevel(Level.MID, ApplicationStatus.APPLIED),
                    createAppWithLevel(Level.JUNIOR, ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            PositionInsightsResponse result = analyticsService.getPositionInsights(USER_ID);

            // Then
            var seniorMetrics = result.byLevel().stream()
                    .filter(l -> l.level().equals("SENIOR"))
                    .findFirst();
            assertThat(seniorMetrics).isPresent();
            assertThat(seniorMetrics.get().percentage()).isCloseTo(50.0, within(0.1));
        }

        @Test
        @DisplayName("Should calculate success rate per level")
        void shouldCalculateSuccessRatePerLevel() {
            // Given: SENIOR has 1 offer out of 3 = 33.3%
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.OFFER_RECEIVED),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.REJECTED),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.REJECTED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            PositionInsightsResponse result = analyticsService.getPositionInsights(USER_ID);

            // Then
            assertThat(result.byLevel()).hasSize(1);
            assertThat(result.byLevel().get(0).successRate()).isCloseTo(33.3, within(0.1));
        }

        @Test
        @DisplayName("Should calculate interview rate per level")
        void shouldCalculateInterviewRatePerLevel() {
            // Given: 4 apps at SENIOR level, 2 reached interview stage (50%)
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.RECRUITER_SCREEN),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.TECH_SCREEN),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.REJECTED),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            PositionInsightsResponse result = analyticsService.getPositionInsights(USER_ID);

            // Then
            assertThat(result.byLevel()).hasSize(1);
            assertThat(result.byLevel().get(0).interviewRate()).isCloseTo(50.0, within(0.1));
        }

        @Test
        @DisplayName("Should calculate average salary per level")
        void shouldCalculateAverageSalaryPerLevel() {
            // Given: Two SENIOR apps with salary data
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLevelAndSalary(Level.SENIOR, 150000.0, 200000.0),
                    createAppWithLevelAndSalary(Level.SENIOR, 170000.0, 220000.0),
                    createAppWithLevelAndSalary(Level.SENIOR, null, null)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            PositionInsightsResponse result = analyticsService.getPositionInsights(USER_ID);

            // Then: Average of (150000, 170000) = 160000 and (200000, 220000) = 210000
            assertThat(result.byLevel()).hasSize(1);
            assertThat(result.byLevel().get(0).avgSalaryMin()).isCloseTo(160000.0, within(0.1));
            assertThat(result.byLevel().get(0).avgSalaryMax()).isCloseTo(210000.0, within(0.1));
        }

        @Test
        @DisplayName("Should return empty response when no applications exist")
        void shouldReturnEmptyResponseWhenNoApplications() {
            // Given
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(Collections.emptyList());

            // When
            PositionInsightsResponse result = analyticsService.getPositionInsights(USER_ID);

            // Then
            assertThat(result.byLevel()).isEmpty();
            assertThat(result.totalApplicationsAnalyzed()).isEqualTo(0L);
        }

        @Test
        @DisplayName("Should return null average salaries when no salary data exists")
        void shouldReturnNullAverageSalariesWhenNoSalaryData() {
            // Given: Applications without salary data
            List<JobApplication> applications = Arrays.asList(
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.APPLIED),
                    createAppWithLevel(Level.SENIOR, ApplicationStatus.APPLIED)
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            PositionInsightsResponse result = analyticsService.getPositionInsights(USER_ID);

            // Then
            assertThat(result.byLevel()).hasSize(1);
            assertThat(result.byLevel().get(0).avgSalaryMin()).isNull();
            assertThat(result.byLevel().get(0).avgSalaryMax()).isNull();
        }
    }

    // ==================== Helper Methods ====================

    private JobApplication createAppWithCompanyAndStatus(String companyName, ApplicationStatus status) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withCompanyName(companyName)
                .withStatus(status)
                .withSalaryMin(null)
                .withSalaryMax(null)
                .build();
    }

    private JobApplication createAppWithCompanyStatusAndDates(String companyName,
                                                               ApplicationStatus status,
                                                               Instant appliedDate,
                                                               Instant statusChangedAt) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withCompanyName(companyName)
                .withStatus(status)
                .withAppliedDate(appliedDate)
                .withStatusChangedAt(statusChangedAt)
                .withSalaryMin(null)
                .withSalaryMax(null)
                .build();
    }

    private JobApplication createAppWithLocation(String location, ApplicationStatus status) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withLocation(location)
                .withStatus(status)
                .withSalaryMin(null)
                .withSalaryMax(null)
                .build();
    }

    private JobApplication createAppWithLocationAndSalary(String location,
                                                           Double salaryMin,
                                                           Double salaryMax) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withLocation(location)
                .withStatus(ApplicationStatus.APPLIED)
                .withSalaryMin(salaryMin)
                .withSalaryMax(salaryMax)
                .build();
    }

    private JobApplication createAppWithRtoType(RtoType rtoType, ApplicationStatus status) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withRtoType(rtoType)
                .withStatus(status)
                .withSalaryMin(null)
                .withSalaryMax(null)
                .build();
    }

    private JobApplication createAppWithLevel(Level level, ApplicationStatus status) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withLevel(level)
                .withStatus(status)
                .withSalaryMin(null)
                .withSalaryMax(null)
                .build();
    }

    private JobApplication createAppWithLevelAndSalary(Level level,
                                                        Double salaryMin,
                                                        Double salaryMax) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withLevel(level)
                .withStatus(ApplicationStatus.APPLIED)
                .withSalaryMin(salaryMin)
                .withSalaryMax(salaryMax)
                .build();
    }
}
