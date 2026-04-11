package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.response.ApplicationHealthResponse;
import com.nolcox.jobtracking.application.dto.response.FunnelAnalyticsResponse;
import com.nolcox.jobtracking.application.dto.response.TransitionMatrixResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationEvent;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.EventType;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.ApplicationEventRepository;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.fixtures.ApplicationEventFixture;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for event-based analytics features in AnalyticsServiceImpl.
 *
 * <p>Tests are organized by feature following TDD principles:
 * - Transition Matrix Analytics
 * - Funnel Analytics
 * - Application Health Indicators</p>
 *
 * <p>Each test section covers happy path scenarios, edge cases, and boundary conditions.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Event-Based Analytics Tests")
class AnalyticsServiceImplEventBasedTest {

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

    // ==================== Transition Matrix Tests ====================

    @Nested
    @DisplayName("Get Transition Matrix Tests")
    class GetTransitionMatrixTests {

        @Test
        @DisplayName("Should return transition counts for status changes")
        void shouldReturnTransitionCountsForStatusChanges() {
            // Given: Multiple status transitions
            List<ApplicationEvent> statusEvents = Arrays.asList(
                    createStatusChangeEvent(ApplicationStatus.APPLIED, ApplicationStatus.RECRUITER_SCREEN),
                    createStatusChangeEvent(ApplicationStatus.APPLIED, ApplicationStatus.RECRUITER_SCREEN),
                    createStatusChangeEvent(ApplicationStatus.APPLIED, ApplicationStatus.REJECTED),
                    createStatusChangeEvent(ApplicationStatus.RECRUITER_SCREEN, ApplicationStatus.TECH_SCREEN),
                    createStatusChangeEvent(ApplicationStatus.RECRUITER_SCREEN, ApplicationStatus.REJECTED),
                    createStatusChangeEvent(ApplicationStatus.TECH_SCREEN, ApplicationStatus.OFFER_RECEIVED)
            );
            when(eventRepository.findStatusTransitionsByUserId(USER_ID)).thenReturn(statusEvents);

            // When
            TransitionMatrixResponse result = analyticsService.getTransitionMatrix(USER_ID);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.totalTransitions()).isEqualTo(6L);
            assertThat(result.transitions()).isNotEmpty();

            // Verify specific transition counts
            // APPLIED -> RECRUITER_SCREEN should have count of 2
            var appliedToRecruiter = result.transitions().stream()
                    .filter(t -> t.fromStatus() == ApplicationStatus.APPLIED
                            && t.toStatus() == ApplicationStatus.RECRUITER_SCREEN)
                    .findFirst();
            assertThat(appliedToRecruiter).isPresent();
            assertThat(appliedToRecruiter.get().count()).isEqualTo(2L);

            // APPLIED -> REJECTED should have count of 1
            var appliedToRejected = result.transitions().stream()
                    .filter(t -> t.fromStatus() == ApplicationStatus.APPLIED
                            && t.toStatus() == ApplicationStatus.REJECTED)
                    .findFirst();
            assertThat(appliedToRejected).isPresent();
            assertThat(appliedToRejected.get().count()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should return all unique statuses for axis labels")
        void shouldReturnAllUniqueStatusesForAxisLabels() {
            // Given
            List<ApplicationEvent> statusEvents = Arrays.asList(
                    createStatusChangeEvent(ApplicationStatus.APPLIED, ApplicationStatus.RECRUITER_SCREEN),
                    createStatusChangeEvent(ApplicationStatus.RECRUITER_SCREEN, ApplicationStatus.TECH_SCREEN),
                    createStatusChangeEvent(ApplicationStatus.TECH_SCREEN, ApplicationStatus.OFFER_RECEIVED)
            );
            when(eventRepository.findStatusTransitionsByUserId(USER_ID)).thenReturn(statusEvents);

            // When
            TransitionMatrixResponse result = analyticsService.getTransitionMatrix(USER_ID);

            // Then: Should contain all 4 unique statuses
            assertThat(result.statuses()).containsExactlyInAnyOrder(
                    ApplicationStatus.APPLIED,
                    ApplicationStatus.RECRUITER_SCREEN,
                    ApplicationStatus.TECH_SCREEN,
                    ApplicationStatus.OFFER_RECEIVED
            );
        }

        @Test
        @DisplayName("Should return empty response when no status transitions exist")
        void shouldReturnEmptyResponseWhenNoStatusTransitions() {
            // Given
            when(eventRepository.findStatusTransitionsByUserId(USER_ID)).thenReturn(Collections.emptyList());

            // When
            TransitionMatrixResponse result = analyticsService.getTransitionMatrix(USER_ID);

            // Then
            assertThat(result.transitions()).isEmpty();
            assertThat(result.statuses()).isEmpty();
            assertThat(result.totalTransitions()).isEqualTo(0L);
        }

        @Test
        @DisplayName("Should handle single transition correctly")
        void shouldHandleSingleTransitionCorrectly() {
            // Given
            List<ApplicationEvent> statusEvents = List.of(
                    createStatusChangeEvent(ApplicationStatus.APPLIED, ApplicationStatus.REJECTED)
            );
            when(eventRepository.findStatusTransitionsByUserId(USER_ID)).thenReturn(statusEvents);

            // When
            TransitionMatrixResponse result = analyticsService.getTransitionMatrix(USER_ID);

            // Then
            assertThat(result.totalTransitions()).isEqualTo(1L);
            assertThat(result.transitions()).hasSize(1);
            assertThat(result.statuses()).containsExactlyInAnyOrder(
                    ApplicationStatus.APPLIED,
                    ApplicationStatus.REJECTED
            );
        }
    }

    // ==================== Funnel Analytics Tests ====================

    @Nested
    @DisplayName("Get Funnel Analytics Tests")
    class GetFunnelAnalyticsTests {

        @Test
        @DisplayName("Should calculate stage conversion rates correctly")
        void shouldCalculateStageConversionRatesCorrectly() {
            // Given: Applications at different stages
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithStatusAndCompany(ApplicationStatus.APPLIED, "Company A", "Software Engineer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.APPLIED, "Company B", "Software Engineer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.RECRUITER_SCREEN, "Company C", "Software Engineer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.RECRUITER_SCREEN, "Company D", "Software Engineer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.TECH_SCREEN, "Company E", "Software Engineer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "Company F", "Software Engineer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.OFFER_RECEIVED, "Company G", "Software Engineer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.OFFER_ACCEPTED, "Company H", "Software Engineer")
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            FunnelAnalyticsResponse result = analyticsService.getFunnelAnalytics(USER_ID);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.totalApplicationsAnalyzed()).isEqualTo(8L);
            assertThat(result.stageConversionRates()).isNotEmpty();

            // 6 out of 8 applications advanced past APPLIED (75%)
            // (RECRUITER_SCREEN x2 + TECH_SCREEN + REJECTED + OFFER_RECEIVED + OFFER_ACCEPTED)
            assertThat(result.stageConversionRates().get(ApplicationStatus.APPLIED))
                    .isCloseTo(75.0, within(0.1));
        }

        @Test
        @DisplayName("Should identify drop-off points correctly")
        void shouldIdentifyDropOffPointsCorrectly() {
            // Given: Applications with various terminal statuses
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "A", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "B", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "C", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.GHOSTED, "D", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.GHOSTED, "E", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.WITHDRAWN, "F", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.OFFER_ACCEPTED, "G", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.APPLIED, "H", "SE")
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            FunnelAnalyticsResponse result = analyticsService.getFunnelAnalytics(USER_ID);

            // Then: Should identify REJECTED as the main drop-off point
            assertThat(result.dropOffPoints()).isNotEmpty();

            var rejectedDropOff = result.dropOffPoints().stream()
                    .filter(d -> d.status() == ApplicationStatus.REJECTED)
                    .findFirst();
            assertThat(rejectedDropOff).isPresent();
            assertThat(rejectedDropOff.get().count()).isEqualTo(3L);
            assertThat(rejectedDropOff.get().percentage()).isCloseTo(37.5, within(0.1));
        }

        @Test
        @DisplayName("Should calculate success rate by company")
        void shouldCalculateSuccessRateByCompany() {
            // Given: Multiple applications to same company with different outcomes
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithStatusAndCompany(ApplicationStatus.OFFER_RECEIVED, "Google", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "Google", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "Google", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.OFFER_ACCEPTED, "Meta", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.APPLIED, "Amazon", "SE")
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            FunnelAnalyticsResponse result = analyticsService.getFunnelAnalytics(USER_ID);

            // Then
            assertThat(result.successRateByCompany()).isNotEmpty();

            // Google: 1 offer out of 3 applications = 33.3%
            var googleRate = result.successRateByCompany().stream()
                    .filter(c -> c.companyName().equals("Google"))
                    .findFirst();
            assertThat(googleRate).isPresent();
            assertThat(googleRate.get().totalApplications()).isEqualTo(3L);
            assertThat(googleRate.get().offersReceived()).isEqualTo(1L);
            assertThat(googleRate.get().successRate()).isCloseTo(33.3, within(0.1));

            // Meta: 1 offer out of 1 application = 100%
            var metaRate = result.successRateByCompany().stream()
                    .filter(c -> c.companyName().equals("Meta"))
                    .findFirst();
            assertThat(metaRate).isPresent();
            assertThat(metaRate.get().successRate()).isCloseTo(100.0, within(0.1));
        }

        @Test
        @DisplayName("Should calculate success rate by position type")
        void shouldCalculateSuccessRateByPositionType() {
            // Given: Applications for different position types
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithStatusAndCompany(ApplicationStatus.OFFER_RECEIVED, "A", "Senior Software Engineer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "B", "Senior Backend Engineer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.OFFER_ACCEPTED, "C", "Staff Engineer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "D", "Junior Developer"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "E", "Junior Developer")
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            FunnelAnalyticsResponse result = analyticsService.getFunnelAnalytics(USER_ID);

            // Then: Should categorize by seniority level keywords
            assertThat(result.successRateByPositionType()).isNotEmpty();

            // Senior positions: 1 offer out of 2 = 50%
            var seniorRate = result.successRateByPositionType().stream()
                    .filter(p -> p.positionType().equalsIgnoreCase("Senior"))
                    .findFirst();
            assertThat(seniorRate).isPresent();
            assertThat(seniorRate.get().successRate()).isCloseTo(50.0, within(0.1));
        }

        @Test
        @DisplayName("Should calculate overall success rate")
        void shouldCalculateOverallSuccessRate() {
            // Given: 2 offers out of 10 applications = 20%
            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithStatusAndCompany(ApplicationStatus.OFFER_RECEIVED, "A", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.OFFER_ACCEPTED, "B", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "C", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "D", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.REJECTED, "E", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.GHOSTED, "F", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.GHOSTED, "G", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.APPLIED, "H", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.APPLIED, "I", "SE"),
                    createApplicationWithStatusAndCompany(ApplicationStatus.TECH_SCREEN, "J", "SE")
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // When
            FunnelAnalyticsResponse result = analyticsService.getFunnelAnalytics(USER_ID);

            // Then
            assertThat(result.overallSuccessRate()).isCloseTo(20.0, within(0.1));
        }

        @Test
        @DisplayName("Should return empty response when no applications exist")
        void shouldReturnEmptyResponseWhenNoApplications() {
            // Given
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(Collections.emptyList());

            // When
            FunnelAnalyticsResponse result = analyticsService.getFunnelAnalytics(USER_ID);

            // Then
            assertThat(result.stageConversionRates()).isEmpty();
            assertThat(result.dropOffPoints()).isEmpty();
            assertThat(result.successRateByCompany()).isEmpty();
            assertThat(result.successRateByPositionType()).isEmpty();
            assertThat(result.overallSuccessRate()).isEqualTo(0.0);
            assertThat(result.totalApplicationsAnalyzed()).isEqualTo(0L);
        }
    }

    // ==================== Application Health Tests ====================

    @Nested
    @DisplayName("Get Application Health Tests")
    class GetApplicationHealthTests {

        @Test
        @DisplayName("Should identify stale applications with no events in X days")
        void shouldIdentifyStaleApplicationsWithNoEventsInXDays() {
            // Given: Applications with varying last event times
            Instant now = Instant.now();
            int staleDays = 14;

            JobApplication staleApp = createApplicationWithId(1L, ApplicationStatus.RECRUITER_SCREEN, "Stale Co", "SE");
            JobApplication activeApp = createApplicationWithId(2L, ApplicationStatus.TECH_SCREEN, "Active Co", "SE");
            JobApplication terminalApp = createApplicationWithId(3L, ApplicationStatus.REJECTED, "Terminal Co", "SE");

            List<JobApplication> applications = Arrays.asList(staleApp, activeApp, terminalApp);
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // Last event timestamps: stale app had event 20 days ago, active app had event 2 days ago
            List<Object[]> lastEventData = Arrays.asList(
                    new Object[]{1L, now.minus(20, ChronoUnit.DAYS)},  // Stale (20 > 14)
                    new Object[]{2L, now.minus(2, ChronoUnit.DAYS)},   // Active (2 < 14)
                    new Object[]{3L, now.minus(30, ChronoUnit.DAYS)}   // Terminal - should be excluded
            );
            when(eventRepository.findLastEventTimestampByApplicationForUser(USER_ID)).thenReturn(lastEventData);
            when(eventRepository.countRecentEventsByApplicationForUser(eq(USER_ID), any(Instant.class)))
                    .thenReturn(Collections.emptyList());

            // When
            ApplicationHealthResponse result = analyticsService.getApplicationHealth(USER_ID, staleDays);

            // Then: Only staleApp should be in stale list (terminal apps excluded)
            assertThat(result.staleApplications()).hasSize(1);
            assertThat(result.staleApplications().get(0).applicationId()).isEqualTo(1L);
            assertThat(result.staleApplications().get(0).companyName()).isEqualTo("Stale Co");
            assertThat(result.staleApplications().get(0).daysSinceLastEvent()).isGreaterThanOrEqualTo(20L);
            assertThat(result.staleDaysThreshold()).isEqualTo(14);
        }

        @Test
        @DisplayName("Should identify hot applications with 3+ events in last 7 days")
        void shouldIdentifyHotApplicationsWithHighActivity() {
            // Given
            Instant now = Instant.now();

            JobApplication hotApp = createApplicationWithId(1L, ApplicationStatus.TECH_SCREEN, "Hot Co", "SE");
            JobApplication normalApp = createApplicationWithId(2L, ApplicationStatus.RECRUITER_SCREEN, "Normal Co", "SE");

            List<JobApplication> applications = Arrays.asList(hotApp, normalApp);
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // Hot app has 5 events in last 7 days, normal app has 1
            List<Object[]> recentEventCounts = Arrays.asList(
                    new Object[]{1L, 5L},  // Hot (5 >= 3)
                    new Object[]{2L, 1L}   // Normal (1 < 3)
            );
            when(eventRepository.countRecentEventsByApplicationForUser(eq(USER_ID), any(Instant.class)))
                    .thenReturn(recentEventCounts);

            List<Object[]> lastEventData = Arrays.asList(
                    new Object[]{1L, now.minus(1, ChronoUnit.DAYS)},
                    new Object[]{2L, now.minus(3, ChronoUnit.DAYS)}
            );
            when(eventRepository.findLastEventTimestampByApplicationForUser(USER_ID)).thenReturn(lastEventData);

            // When
            ApplicationHealthResponse result = analyticsService.getApplicationHealth(USER_ID, 14);

            // Then
            assertThat(result.hotApplications()).hasSize(1);
            assertThat(result.hotApplications().get(0).applicationId()).isEqualTo(1L);
            assertThat(result.hotApplications().get(0).companyName()).isEqualTo("Hot Co");
            assertThat(result.hotApplications().get(0).recentEventCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should identify quick wins - offers within 7 days")
        void shouldIdentifyQuickWinsOffersWithin7Days() {
            // Given: Application that got offer within 7 days
            Instant now = Instant.now();
            Instant appliedDate = now.minus(5, ChronoUnit.DAYS);

            JobApplication quickWinApp = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withStatus(ApplicationStatus.OFFER_RECEIVED)
                    .withCompanyName("Quick Win Co")
                    .withPositionTitle("SE")
                    .withAppliedDate(appliedDate)
                    .withStatusChangedAt(now.minus(1, ChronoUnit.DAYS))
                    .build();

            JobApplication slowWinApp = JobApplicationFixture.aJobApplication()
                    .withId(2L)
                    .withUser(testUser)
                    .withStatus(ApplicationStatus.OFFER_ACCEPTED)
                    .withCompanyName("Slow Win Co")
                    .withPositionTitle("SE")
                    .withAppliedDate(now.minus(30, ChronoUnit.DAYS))
                    .withStatusChangedAt(now.minus(1, ChronoUnit.DAYS))
                    .build();

            List<JobApplication> applications = Arrays.asList(quickWinApp, slowWinApp);
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);
            when(eventRepository.findLastEventTimestampByApplicationForUser(USER_ID))
                    .thenReturn(Collections.emptyList());
            when(eventRepository.countRecentEventsByApplicationForUser(eq(USER_ID), any(Instant.class)))
                    .thenReturn(Collections.emptyList());

            // When
            ApplicationHealthResponse result = analyticsService.getApplicationHealth(USER_ID, 14);

            // Then: Only quickWinApp should be in quick wins (resolved within 7 days)
            assertThat(result.quickWins()).hasSize(1);
            assertThat(result.quickWins().get(0).applicationId()).isEqualTo(1L);
            assertThat(result.quickWins().get(0).companyName()).isEqualTo("Quick Win Co");
            assertThat(result.quickWins().get(0).daysToResolution()).isLessThanOrEqualTo(7L);
        }

        @Test
        @DisplayName("Should identify quick losses - rejections within 7 days")
        void shouldIdentifyQuickLossesRejectionsWithin7Days() {
            // Given: Application that was rejected within 7 days
            Instant now = Instant.now();

            JobApplication quickLossApp = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withStatus(ApplicationStatus.REJECTED)
                    .withCompanyName("Quick Loss Co")
                    .withPositionTitle("SE")
                    .withAppliedDate(now.minus(3, ChronoUnit.DAYS))
                    .withStatusChangedAt(now.minus(1, ChronoUnit.DAYS))
                    .build();

            JobApplication slowLossApp = JobApplicationFixture.aJobApplication()
                    .withId(2L)
                    .withUser(testUser)
                    .withStatus(ApplicationStatus.GHOSTED)
                    .withCompanyName("Slow Loss Co")
                    .withPositionTitle("SE")
                    .withAppliedDate(now.minus(45, ChronoUnit.DAYS))
                    .withStatusChangedAt(now.minus(1, ChronoUnit.DAYS))
                    .build();

            List<JobApplication> applications = Arrays.asList(quickLossApp, slowLossApp);
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);
            when(eventRepository.findLastEventTimestampByApplicationForUser(USER_ID))
                    .thenReturn(Collections.emptyList());
            when(eventRepository.countRecentEventsByApplicationForUser(eq(USER_ID), any(Instant.class)))
                    .thenReturn(Collections.emptyList());

            // When
            ApplicationHealthResponse result = analyticsService.getApplicationHealth(USER_ID, 14);

            // Then: Only quickLossApp should be in quick losses
            assertThat(result.quickLosses()).hasSize(1);
            assertThat(result.quickLosses().get(0).applicationId()).isEqualTo(1L);
            assertThat(result.quickLosses().get(0).companyName()).isEqualTo("Quick Loss Co");
            assertThat(result.quickLosses().get(0).daysToResolution()).isLessThanOrEqualTo(7L);
        }

        @Test
        @DisplayName("Should use default stale days threshold when not specified")
        void shouldUseDefaultStaleDaysThreshold() {
            // Given: Empty list returns early, so no event repo calls needed
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(Collections.emptyList());

            // When: Pass null for staleDays
            ApplicationHealthResponse result = analyticsService.getApplicationHealth(USER_ID, null);

            // Then: Should use default of 14 days
            assertThat(result.staleDaysThreshold()).isEqualTo(14);
        }

        @Test
        @DisplayName("Should return health summary with correct counts")
        void shouldReturnHealthSummaryWithCorrectCounts() {
            // Given: Mix of stale, hot, and quick outcome applications
            Instant now = Instant.now();

            List<JobApplication> applications = Arrays.asList(
                    // Stale (active, no recent events)
                    createApplicationWithId(1L, ApplicationStatus.RECRUITER_SCREEN, "Stale 1", "SE"),
                    createApplicationWithId(2L, ApplicationStatus.TECH_SCREEN, "Stale 2", "SE"),
                    // Hot (active, many recent events)
                    createApplicationWithId(3L, ApplicationStatus.TECHNICAL_I, "Hot 1", "SE"),
                    // Quick win
                    createQuickOutcomeApp(4L, ApplicationStatus.OFFER_RECEIVED, "Quick Win", "SE", 5, now),
                    // Quick loss
                    createQuickOutcomeApp(5L, ApplicationStatus.REJECTED, "Quick Loss", "SE", 3, now),
                    // Active but neither stale nor hot
                    createApplicationWithId(6L, ApplicationStatus.APPLIED, "Normal", "SE")
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // Last events: apps 1,2 are stale (>14 days), others are recent
            List<Object[]> lastEventData = Arrays.asList(
                    new Object[]{1L, now.minus(20, ChronoUnit.DAYS)},
                    new Object[]{2L, now.minus(18, ChronoUnit.DAYS)},
                    new Object[]{3L, now.minus(1, ChronoUnit.DAYS)},
                    new Object[]{4L, now.minus(1, ChronoUnit.DAYS)},
                    new Object[]{5L, now.minus(1, ChronoUnit.DAYS)},
                    new Object[]{6L, now.minus(5, ChronoUnit.DAYS)}
            );
            when(eventRepository.findLastEventTimestampByApplicationForUser(USER_ID)).thenReturn(lastEventData);

            // Recent event counts: app 3 is hot (5 events)
            List<Object[]> recentEventCounts = Arrays.asList(
                    new Object[]{3L, 5L},
                    new Object[]{6L, 1L}
            );
            when(eventRepository.countRecentEventsByApplicationForUser(eq(USER_ID), any(Instant.class)))
                    .thenReturn(recentEventCounts);

            // When
            ApplicationHealthResponse result = analyticsService.getApplicationHealth(USER_ID, 14);

            // Then
            assertThat(result.summary()).isNotNull();
            assertThat(result.summary().staleCount()).isEqualTo(2);
            assertThat(result.summary().hotCount()).isEqualTo(1);
            assertThat(result.summary().quickWinCount()).isEqualTo(1);
            assertThat(result.summary().quickLossCount()).isEqualTo(1);
            // Active count: non-terminal statuses
            // (RECRUITER_SCREEN, TECH_SCREEN, TECHNICAL_I, OFFER_RECEIVED, APPLIED = 5)
            // REJECTED is terminal, but OFFER_RECEIVED is not (only OFFER_ACCEPTED/DECLINED/RESCINDED are terminal)
            assertThat(result.summary().activeCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should return empty response when no applications exist")
        void shouldReturnEmptyResponseWhenNoApplications() {
            // Given: Empty applications list causes early return, no event repo calls needed
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(Collections.emptyList());

            // When
            ApplicationHealthResponse result = analyticsService.getApplicationHealth(USER_ID, 14);

            // Then
            assertThat(result.staleApplications()).isEmpty();
            assertThat(result.hotApplications()).isEmpty();
            assertThat(result.quickWins()).isEmpty();
            assertThat(result.quickLosses()).isEmpty();
            assertThat(result.summary().staleCount()).isEqualTo(0);
            assertThat(result.summary().hotCount()).isEqualTo(0);
            assertThat(result.summary().activeCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should exclude terminal status applications from stale detection")
        void shouldExcludeTerminalStatusFromStaleDetection() {
            // Given: Only terminal status applications with old last events
            Instant now = Instant.now();

            List<JobApplication> applications = Arrays.asList(
                    createApplicationWithId(1L, ApplicationStatus.REJECTED, "Rejected Co", "SE"),
                    createApplicationWithId(2L, ApplicationStatus.WITHDRAWN, "Withdrawn Co", "SE"),
                    createApplicationWithId(3L, ApplicationStatus.GHOSTED, "Ghosted Co", "SE"),
                    createApplicationWithId(4L, ApplicationStatus.OFFER_ACCEPTED, "Accepted Co", "SE")
            );
            when(jobApplicationRepository.findAllByUserId(USER_ID)).thenReturn(applications);

            // All have very old last events
            List<Object[]> lastEventData = Arrays.asList(
                    new Object[]{1L, now.minus(60, ChronoUnit.DAYS)},
                    new Object[]{2L, now.minus(60, ChronoUnit.DAYS)},
                    new Object[]{3L, now.minus(60, ChronoUnit.DAYS)},
                    new Object[]{4L, now.minus(60, ChronoUnit.DAYS)}
            );
            when(eventRepository.findLastEventTimestampByApplicationForUser(USER_ID)).thenReturn(lastEventData);
            when(eventRepository.countRecentEventsByApplicationForUser(eq(USER_ID), any(Instant.class)))
                    .thenReturn(Collections.emptyList());

            // When
            ApplicationHealthResponse result = analyticsService.getApplicationHealth(USER_ID, 14);

            // Then: No stale applications because all are terminal
            assertThat(result.staleApplications()).isEmpty();
        }
    }

    // ==================== Helper Methods ====================

    private ApplicationEvent createStatusChangeEvent(ApplicationStatus from, ApplicationStatus to) {
        JobApplication app = JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withStatus(to)
                .build();

        return ApplicationEventFixture.statusChangedEvent()
                .withApplication(app)
                .withOldValue(from.name())
                .withNewValue(to.name())
                .withCreatedAt(Instant.now())
                .build();
    }

    private JobApplication createApplicationWithStatusAndCompany(ApplicationStatus status,
                                                                   String companyName,
                                                                   String positionTitle) {
        return JobApplicationFixture.aJobApplication()
                .withUser(testUser)
                .withStatus(status)
                .withCompanyName(companyName)
                .withPositionTitle(positionTitle)
                .build();
    }

    private JobApplication createApplicationWithId(Long id, ApplicationStatus status,
                                                    String companyName, String positionTitle) {
        return JobApplicationFixture.aJobApplication()
                .withId(id)
                .withUser(testUser)
                .withStatus(status)
                .withCompanyName(companyName)
                .withPositionTitle(positionTitle)
                .build();
    }

    private JobApplication createQuickOutcomeApp(Long id, ApplicationStatus status,
                                                  String companyName, String positionTitle,
                                                  int daysToResolve, Instant now) {
        return JobApplicationFixture.aJobApplication()
                .withId(id)
                .withUser(testUser)
                .withStatus(status)
                .withCompanyName(companyName)
                .withPositionTitle(positionTitle)
                .withAppliedDate(now.minus(daysToResolve, ChronoUnit.DAYS))
                .withStatusChangedAt(now)
                .build();
    }
}
