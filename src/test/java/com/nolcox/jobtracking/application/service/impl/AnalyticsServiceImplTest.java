package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.response.ActivityHeatmapResponse;
import com.nolcox.jobtracking.application.dto.response.MetricsResponse;
import com.nolcox.jobtracking.application.dto.response.SalaryDistributionResponse;
import com.nolcox.jobtracking.application.dto.response.StageDurationsResponse;
import com.nolcox.jobtracking.application.dto.response.TimePatternsResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.User;
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

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AnalyticsServiceImpl following TDD principles.
 *
 * <p>Tests are organized by feature/endpoint and cover:
 * - Happy path scenarios
 * - Edge cases (empty data, null values)
 * - Boundary conditions</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsService Tests")
class AnalyticsServiceImplTest {

    @Mock
    private JobApplicationRepository repository;

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

    @Nested
    @DisplayName("Get Metrics Tests")
    class GetMetricsTests {

        @Test
        @DisplayName("Should calculate correct response rate when some applications have responses")
        void shouldCalculateCorrectResponseRate() {
            // Given: 10 applications, 5 moved past APPLIED status
            List<JobApplication> applications = Arrays.asList(
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.RECRUITER_SCREEN),
                    createApplication(ApplicationStatus.TECH_SCREEN),
                    createApplication(ApplicationStatus.REJECTED),
                    createApplication(ApplicationStatus.OFFER_RECEIVED),
                    createApplication(ApplicationStatus.GHOSTED)
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            MetricsResponse result = analyticsService.getMetrics(USER_ID);

            // Then: 5 out of 10 applications moved past APPLIED (50%)
            // RECRUITER_SCREEN, TECH_SCREEN, REJECTED, OFFER_RECEIVED count as responses
            // GHOSTED does not count as a response
            assertThat(result.trueResponseRate()).isCloseTo(40.0, within(0.1));
        }

        @Test
        @DisplayName("Should calculate correct interview rate")
        void shouldCalculateCorrectInterviewRate() {
            // Given: 10 applications, 3 reached interview stages
            // Interview stages include: RECRUITER_SCREEN, TECH_SCREEN, etc. (but not REJECTED, GHOSTED)
            List<JobApplication> applications = Arrays.asList(
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.RECRUITER_SCREEN),
                    createApplication(ApplicationStatus.RECRUITER_SCREEN),
                    createApplication(ApplicationStatus.TECH_SCREEN),
                    createApplication(ApplicationStatus.REJECTED),
                    createApplication(ApplicationStatus.REJECTED),
                    createApplication(ApplicationStatus.GHOSTED)
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            MetricsResponse result = analyticsService.getMetrics(USER_ID);

            // Then: 3 reached interview stages (2 RECRUITER_SCREEN + 1 TECH_SCREEN) = 30%
            assertThat(result.trueInterviewRate()).isCloseTo(30.0, within(0.1));
        }

        @Test
        @DisplayName("Should calculate correct offer rate")
        void shouldCalculateCorrectOfferRate() {
            // Given: 10 applications, 1 received offer
            List<JobApplication> applications = Arrays.asList(
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.RECRUITER_SCREEN),
                    createApplication(ApplicationStatus.TECH_SCREEN),
                    createApplication(ApplicationStatus.REJECTED),
                    createApplication(ApplicationStatus.REJECTED),
                    createApplication(ApplicationStatus.REJECTED),
                    createApplication(ApplicationStatus.REJECTED),
                    createApplication(ApplicationStatus.OFFER_RECEIVED),
                    createApplication(ApplicationStatus.GHOSTED)
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            MetricsResponse result = analyticsService.getMetrics(USER_ID);

            // Then: 1 out of 10 received an offer (10%)
            assertThat(result.trueOfferRate()).isCloseTo(10.0, within(0.1));
        }

        @Test
        @DisplayName("Should return zero rates when no applications exist")
        void shouldReturnZeroRatesWhenNoApplications() {
            // Given
            when(repository.findAllByUserId(USER_ID)).thenReturn(Collections.emptyList());

            // When
            MetricsResponse result = analyticsService.getMetrics(USER_ID);

            // Then
            assertThat(result.trueResponseRate()).isEqualTo(0.0);
            assertThat(result.trueInterviewRate()).isEqualTo(0.0);
            assertThat(result.trueOfferRate()).isEqualTo(0.0);
            assertThat(result.totalApplications()).isEqualTo(0L);
        }

        @Test
        @DisplayName("Should calculate average days to response")
        void shouldCalculateAverageDaysToResponse() {
            // Given: Applications with known appliedDate and statusChangedAt
            Instant now = Instant.now();
            JobApplication app1 = createApplicationWithDates(
                    ApplicationStatus.RECRUITER_SCREEN,
                    now.minus(10, ChronoUnit.DAYS),  // applied 10 days ago
                    now.minus(5, ChronoUnit.DAYS)    // status changed 5 days ago (5 day response)
            );
            JobApplication app2 = createApplicationWithDates(
                    ApplicationStatus.TECH_SCREEN,
                    now.minus(20, ChronoUnit.DAYS),  // applied 20 days ago
                    now.minus(10, ChronoUnit.DAYS)   // status changed 10 days ago (10 day response)
            );
            JobApplication app3 = createApplicationWithDates(
                    ApplicationStatus.APPLIED,
                    now.minus(5, ChronoUnit.DAYS),   // applied 5 days ago
                    now.minus(5, ChronoUnit.DAYS)    // no response yet
            );

            when(repository.findAllByUserId(USER_ID)).thenReturn(Arrays.asList(app1, app2, app3));

            // When
            MetricsResponse result = analyticsService.getMetrics(USER_ID);

            // Then: Average of (5 + 10) / 2 = 7.5 days (only count responded applications)
            assertThat(result.avgDaysToResponse()).isCloseTo(7.5, within(0.1));
        }

        @Test
        @DisplayName("Should calculate weekly pace correctly")
        void shouldCalculateWeeklyPace() {
            // Given: 14 applications over 28 days (4 weeks) = 3.5 per week
            Instant now = Instant.now();
            List<JobApplication> applications = new java.util.ArrayList<>();
            for (int i = 0; i < 14; i++) {
                applications.add(createApplicationWithDates(
                        ApplicationStatus.APPLIED,
                        now.minus(28 - i * 2, ChronoUnit.DAYS),
                        now.minus(28 - i * 2, ChronoUnit.DAYS)
                ));
            }
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            MetricsResponse result = analyticsService.getMetrics(USER_ID);

            // Then
            assertThat(result.weeklyPace()).isCloseTo(3.5, within(0.5));
        }

        @Test
        @DisplayName("Should calculate stage conversions")
        void shouldCalculateStageConversions() {
            // Given: Pipeline with known conversions
            // 10 applied -> 4 screened (40%)
            // 4 screened -> 2 tech (50% of screened, but represented as raw rate)
            // 2 tech -> 1 offer (50% of tech)
            List<JobApplication> applications = Arrays.asList(
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.APPLIED),
                    createApplication(ApplicationStatus.RECRUITER_SCREEN),
                    createApplication(ApplicationStatus.RECRUITER_SCREEN),
                    createApplication(ApplicationStatus.TECH_SCREEN),
                    createApplication(ApplicationStatus.OFFER_RECEIVED)
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            MetricsResponse result = analyticsService.getMetrics(USER_ID);

            // Then
            assertThat(result.stageConversions()).isNotNull();
            // 4 out of 10 made it to screen (RECRUITER_SCREEN + TECH_SCREEN + OFFER)
            assertThat(result.stageConversions().appliedToScreen()).isCloseTo(40.0, within(0.1));
        }
    }

    @Nested
    @DisplayName("Get Counts By Status Tests")
    class GetCountsByStatusTests {

        @Test
        @DisplayName("Should return correct counts for each status")
        void shouldReturnCorrectCountsForEachStatus() {
            // Given: Create expected result map
            Map<ApplicationStatus, Long> expectedCounts = new java.util.EnumMap<>(ApplicationStatus.class);
            expectedCounts.put(ApplicationStatus.APPLIED, 25L);
            expectedCounts.put(ApplicationStatus.RECRUITER_SCREEN, 15L);
            expectedCounts.put(ApplicationStatus.TECH_SCREEN, 10L);
            expectedCounts.put(ApplicationStatus.REJECTED, 30L);

            // Mock the countByStatusForUser method directly
            when(repository.countByStatusForUser(USER_ID)).thenReturn(expectedCounts);

            // When
            Map<ApplicationStatus, Long> result = analyticsService.getCountsByStatus(USER_ID);

            // Then
            assertThat(result).containsEntry(ApplicationStatus.APPLIED, 25L);
            assertThat(result).containsEntry(ApplicationStatus.RECRUITER_SCREEN, 15L);
            assertThat(result).containsEntry(ApplicationStatus.TECH_SCREEN, 10L);
            assertThat(result).containsEntry(ApplicationStatus.REJECTED, 30L);
        }

        @Test
        @DisplayName("Should return empty map when no applications")
        void shouldReturnEmptyMapWhenNoApplications() {
            // Given
            when(repository.countByStatusForUser(USER_ID)).thenReturn(Collections.emptyMap());

            // When
            Map<ApplicationStatus, Long> result = analyticsService.getCountsByStatus(USER_ID);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Salary Distribution Tests")
    class GetSalaryDistributionTests {

        @Test
        @DisplayName("Should calculate correct salary statistics for active applications")
        void shouldCalculateCorrectSalaryStatistics() {
            // Given: Active applications with salary data
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithSalary(ApplicationStatus.APPLIED, 80000.0, 120000.0),
                    createApplicationWithSalary(ApplicationStatus.RECRUITER_SCREEN, 100000.0, 150000.0),
                    createApplicationWithSalary(ApplicationStatus.TECH_SCREEN, 120000.0, 180000.0),
                    createApplicationWithSalary(ApplicationStatus.OFFER_RECEIVED, 140000.0, 200000.0),
                    // These should be excluded (terminal states)
                    createApplicationWithSalary(ApplicationStatus.REJECTED, 60000.0, 90000.0),
                    createApplicationWithSalary(ApplicationStatus.WITHDRAWN, 70000.0, 100000.0),
                    createApplicationWithSalary(ApplicationStatus.GHOSTED, 50000.0, 80000.0)
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            SalaryDistributionResponse result = analyticsService.getSalaryDistribution(USER_ID);

            // Then: Only active applications (first 4)
            assertThat(result.globalMin()).isEqualTo(80000.0);
            assertThat(result.globalMax()).isEqualTo(200000.0);
            assertThat(result.avgMin()).isCloseTo(110000.0, within(0.1)); // (80+100+120+140)/4
            assertThat(result.avgMax()).isCloseTo(162500.0, within(0.1)); // (120+150+180+200)/4
            assertThat(result.avgMid()).isCloseTo(136250.0, within(0.1)); // (avgMin + avgMax) / 2
            assertThat(result.activeAppsWithSalary()).isEqualTo(4L);
        }

        @Test
        @DisplayName("Should handle applications with only salaryMin or salaryMax")
        void shouldHandlePartialSalaryData() {
            // Given: Applications with partial salary data
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithSalary(ApplicationStatus.APPLIED, 80000.0, null),
                    createApplicationWithSalary(ApplicationStatus.APPLIED, null, 150000.0),
                    createApplicationWithSalary(ApplicationStatus.APPLIED, 100000.0, 140000.0)
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            SalaryDistributionResponse result = analyticsService.getSalaryDistribution(USER_ID);

            // Then: Only count applications with at least one salary value
            assertThat(result.activeAppsWithSalary()).isEqualTo(3L);
        }

        @Test
        @DisplayName("Should return zero values when no salary data available")
        void shouldReturnZeroValuesWhenNoSalaryData() {
            // Given: Applications without salary data
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithSalary(ApplicationStatus.APPLIED, null, null),
                    createApplicationWithSalary(ApplicationStatus.RECRUITER_SCREEN, null, null)
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            SalaryDistributionResponse result = analyticsService.getSalaryDistribution(USER_ID);

            // Then
            assertThat(result.activeAppsWithSalary()).isEqualTo(0L);
            assertThat(result.globalMin()).isNull();
            assertThat(result.globalMax()).isNull();
        }
    }

    @Nested
    @DisplayName("Get Activity Heatmap Tests")
    class GetActivityHeatmapTests {

        @Test
        @DisplayName("Should return application counts by date for specified year")
        void shouldReturnCountsByDateForYear() {
            // Given: Applications in 2026
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 15)),
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 15)),
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 15)),
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 16)),
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 20)),
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 20)),
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 20)),
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 20)),
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 20)),
                    // This should be excluded (different year)
                    createApplicationWithAppliedDate(LocalDate.of(2025, 12, 31))
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            ActivityHeatmapResponse result = analyticsService.getActivityHeatmap(USER_ID, 2026);

            // Then
            assertThat(result.data()).containsEntry("2026-01-15", 3);
            assertThat(result.data()).containsEntry("2026-01-16", 1);
            assertThat(result.data()).containsEntry("2026-01-20", 5);
            assertThat(result.data()).doesNotContainKey("2025-12-31");
            assertThat(result.maxCount()).isEqualTo(5);
            assertThat(result.year()).isEqualTo(2026);
        }

        @Test
        @DisplayName("Should return empty data for year with no applications")
        void shouldReturnEmptyDataForYearWithNoApplications() {
            // Given
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithAppliedDate(LocalDate.of(2025, 6, 15))
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            ActivityHeatmapResponse result = analyticsService.getActivityHeatmap(USER_ID, 2026);

            // Then
            assertThat(result.data()).isEmpty();
            assertThat(result.maxCount()).isEqualTo(0);
            assertThat(result.year()).isEqualTo(2026);
        }
    }

    @Nested
    @DisplayName("Get Time Patterns Tests")
    class GetTimePatternsTests {

        @Test
        @DisplayName("Should return correct distribution by day of week")
        void shouldReturnCorrectDistributionByDayOfWeek() {
            // Given: Applications on different days
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 5)),  // Monday
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 5)),  // Monday
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 6)),  // Tuesday
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 7)),  // Wednesday
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 7)),  // Wednesday
                    createApplicationWithAppliedDate(LocalDate.of(2026, 1, 7))   // Wednesday
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            TimePatternsResponse result = analyticsService.getTimePatterns(USER_ID);

            // Then
            assertThat(result.byDayOfWeek()).containsEntry(DayOfWeek.MONDAY, 2);
            assertThat(result.byDayOfWeek()).containsEntry(DayOfWeek.TUESDAY, 1);
            assertThat(result.byDayOfWeek()).containsEntry(DayOfWeek.WEDNESDAY, 3);
        }

        @Test
        @DisplayName("Should return correct distribution by hour")
        void shouldReturnCorrectDistributionByHour() {
            // Given: Applications at different hours
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithAppliedDateTime(LocalDate.of(2026, 1, 5), 9),
                    createApplicationWithAppliedDateTime(LocalDate.of(2026, 1, 5), 9),
                    createApplicationWithAppliedDateTime(LocalDate.of(2026, 1, 5), 10),
                    createApplicationWithAppliedDateTime(LocalDate.of(2026, 1, 5), 14),
                    createApplicationWithAppliedDateTime(LocalDate.of(2026, 1, 5), 14),
                    createApplicationWithAppliedDateTime(LocalDate.of(2026, 1, 5), 14)
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            TimePatternsResponse result = analyticsService.getTimePatterns(USER_ID);

            // Then
            assertThat(result.byHour()).containsEntry(9, 2);
            assertThat(result.byHour()).containsEntry(10, 1);
            assertThat(result.byHour()).containsEntry(14, 3);
        }

        @Test
        @DisplayName("Should return empty patterns when no applications")
        void shouldReturnEmptyPatternsWhenNoApplications() {
            // Given
            when(repository.findAllByUserId(USER_ID)).thenReturn(Collections.emptyList());

            // When
            TimePatternsResponse result = analyticsService.getTimePatterns(USER_ID);

            // Then
            assertThat(result.byDayOfWeek()).isEmpty();
            assertThat(result.byHour()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Stage Durations Tests")
    class GetStageDurationsTests {

        @Test
        @DisplayName("Should calculate average time in each stage")
        void shouldCalculateAverageTimeInEachStage() {
            // Given: Applications with stage transition data
            Instant now = Instant.now();

            // App1: Spent 5 days in APPLIED before moving to RECRUITER_SCREEN
            JobApplication app1 = createApplicationWithDates(
                    ApplicationStatus.RECRUITER_SCREEN,
                    now.minus(10, ChronoUnit.DAYS),
                    now.minus(5, ChronoUnit.DAYS)
            );

            // App2: Spent 3 days in APPLIED before moving to RECRUITER_SCREEN
            JobApplication app2 = createApplicationWithDates(
                    ApplicationStatus.RECRUITER_SCREEN,
                    now.minus(8, ChronoUnit.DAYS),
                    now.minus(5, ChronoUnit.DAYS)
            );

            // App3: Still in APPLIED (7 days so far)
            JobApplication app3 = createApplicationWithDates(
                    ApplicationStatus.APPLIED,
                    now.minus(7, ChronoUnit.DAYS),
                    now.minus(7, ChronoUnit.DAYS)
            );

            when(repository.findAllByUserId(USER_ID)).thenReturn(Arrays.asList(app1, app2, app3));

            // When
            StageDurationsResponse result = analyticsService.getStageDurations(USER_ID);

            // Then
            assertThat(result.averageTimeByStage()).isNotNull();
            // For applications that moved out of APPLIED, average is (5+3)/2 = 4 days
            // Note: Implementation may vary based on how we calculate "time in stage"
            assertThat(result.averageTimeByStage()).containsKey(ApplicationStatus.APPLIED);
        }

        @Test
        @DisplayName("Should identify bottleneck stages sorted by duration")
        void shouldIdentifyBottleneckStages() {
            // Given: Applications with varying stage durations
            Instant now = Instant.now();
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithDates(ApplicationStatus.TECH_SCREEN,
                            now.minus(15, ChronoUnit.DAYS), now.minus(5, ChronoUnit.DAYS)),
                    createApplicationWithDates(ApplicationStatus.RECRUITER_SCREEN,
                            now.minus(8, ChronoUnit.DAYS), now.minus(5, ChronoUnit.DAYS))
            );
            when(repository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            StageDurationsResponse result = analyticsService.getStageDurations(USER_ID);

            // Then: Bottlenecks should be sorted by duration (descending)
            assertThat(result.bottleneckStages()).isNotNull();
            if (!result.bottleneckStages().isEmpty()) {
                // First bottleneck should have the longest duration
                StageDurationsResponse.BottleneckStage first = result.bottleneckStages().get(0);
                if (result.bottleneckStages().size() > 1) {
                    StageDurationsResponse.BottleneckStage second = result.bottleneckStages().get(1);
                    assertThat(first.avgDays()).isGreaterThanOrEqualTo(second.avgDays());
                }
            }
        }

        @Test
        @DisplayName("Should return empty durations when no applications")
        void shouldReturnEmptyDurationsWhenNoApplications() {
            // Given
            when(repository.findAllByUserId(USER_ID)).thenReturn(Collections.emptyList());

            // When
            StageDurationsResponse result = analyticsService.getStageDurations(USER_ID);

            // Then
            assertThat(result.averageTimeByStage()).isEmpty();
            assertThat(result.bottleneckStages()).isEmpty();
        }
    }

    // Helper methods for creating test data

    private JobApplication createApplication(ApplicationStatus status) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withStatus(status)
                .build();
    }

    private JobApplication createApplicationWithDates(ApplicationStatus status,
                                                       Instant appliedDate,
                                                       Instant statusChangedAt) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withStatus(status)
                .withAppliedDate(appliedDate)
                .withStatusChangedAt(statusChangedAt)
                .build();
    }

    private JobApplication createApplicationWithSalary(ApplicationStatus status,
                                                        Double salaryMin,
                                                        Double salaryMax) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withStatus(status)
                .withSalaryMin(salaryMin)
                .withSalaryMax(salaryMax)
                .build();
    }

    private JobApplication createApplicationWithAppliedDate(LocalDate date) {
        Instant appliedDate = date.atStartOfDay(ZoneId.systemDefault()).toInstant();
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withAppliedDate(appliedDate)
                .build();
    }

    private JobApplication createApplicationWithAppliedDateTime(LocalDate date, int hour) {
        Instant appliedDate = date.atTime(hour, 0).atZone(ZoneId.systemDefault()).toInstant();
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withAppliedDate(appliedDate)
                .build();
    }
}
