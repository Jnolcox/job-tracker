package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.response.ActivityHeatmapResponse;
import com.nolcox.jobtracking.application.dto.response.ApplicationHealthResponse;
import com.nolcox.jobtracking.application.dto.response.ApplicationHealthResponse.HealthSummary;
import com.nolcox.jobtracking.application.dto.response.ApplicationHealthResponse.HotApplication;
import com.nolcox.jobtracking.application.dto.response.ApplicationHealthResponse.QuickOutcome;
import com.nolcox.jobtracking.application.dto.response.ApplicationHealthResponse.StaleApplication;
import com.nolcox.jobtracking.application.dto.response.CompanyInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.CompanyInsightsResponse.CompanyMetrics;
import com.nolcox.jobtracking.application.dto.response.FunnelAnalyticsResponse;
import com.nolcox.jobtracking.application.dto.response.FunnelAnalyticsResponse.CompanySuccessRate;
import com.nolcox.jobtracking.application.dto.response.FunnelAnalyticsResponse.DropOffPoint;
import com.nolcox.jobtracking.application.dto.response.FunnelAnalyticsResponse.PositionTypeSuccessRate;
import com.nolcox.jobtracking.application.dto.response.LocationInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.LocationInsightsResponse.LocationMetrics;
import com.nolcox.jobtracking.application.dto.response.LocationInsightsResponse.RtoMetrics;
import com.nolcox.jobtracking.application.dto.response.MetricsResponse;
import com.nolcox.jobtracking.application.dto.response.MetricsResponse.StageConversions;
import com.nolcox.jobtracking.application.dto.response.PositionInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.PositionInsightsResponse.LevelMetrics;
import com.nolcox.jobtracking.application.dto.response.SalaryDistributionResponse;
import com.nolcox.jobtracking.application.dto.response.SalaryDistributionResponse.ApplicationSalaryEntry;
import com.nolcox.jobtracking.application.dto.response.StageDurationsResponse;
import com.nolcox.jobtracking.application.dto.response.StageDurationsResponse.BottleneckStage;
import com.nolcox.jobtracking.application.dto.response.TimePatternsResponse;
import com.nolcox.jobtracking.application.dto.response.TransitionMatrixResponse;
import com.nolcox.jobtracking.application.dto.response.TransitionMatrixResponse.StatusTransition;
import com.nolcox.jobtracking.application.service.AnalyticsService;
import com.nolcox.jobtracking.domain.entity.ApplicationEvent;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.repository.ApplicationEventRepository;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Implementation of {@link AnalyticsService} for job application analytics.
 *
 * <p>This service calculates various metrics and statistics about a user's
 * job search, including response rates, interview rates, timing metrics,
 * and application patterns.</p>
 *
 * <p>All calculations filter data by the authenticated user to ensure
 * data isolation between users.</p>
 *
 * <p><strong>Status Set Hierarchy:</strong></p>
 * <p>The status sets are organized hierarchically to avoid duplication.
 * More specific sets are derived from broader ones using set operations:</p>
 * <ul>
 *   <li>OFFER_STATUSES: Base set for all offer-related stages</li>
 *   <li>TECH_STATUSES: Technical stages + OFFER_STATUSES</li>
 *   <li>INTERVIEW_STATUSES: Screen stages + TECH_STATUSES (same as SCREEN_STATUSES)</li>
 *   <li>RESPONSE_STATUSES: INTERVIEW_STATUSES + response-only statuses</li>
 * </ul>
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final JobApplicationRepository repository;
    private final ApplicationEventRepository eventRepository;

    // ============================================================================
    // STATUS SET HIERARCHY
    // Built bottom-up: specific sets first, broader sets derive from them.
    // This eliminates duplication and makes the relationships clear.
    // ============================================================================

    /**
     * Status values that indicate the application received an offer.
     * This is the most specific set - forms the base of the hierarchy.
     */
    private static final Set<ApplicationStatus> OFFER_STATUSES = EnumSet.of(
            ApplicationStatus.OFFER_RECEIVED,
            ApplicationStatus.NEGOTIATING,
            ApplicationStatus.OFFER_ACCEPTED,
            ApplicationStatus.OFFER_DECLINED,
            ApplicationStatus.OFFER_RESCINDED
    );

    /**
     * Status values that indicate the application reached a technical interview stage.
     * Includes all technical stages plus OFFER_STATUSES (since offers imply passing tech).
     */
    private static final Set<ApplicationStatus> TECH_STATUSES;

    static {
        // TECH_STATUSES = technical interview stages + reference check + all offer stages
        TECH_STATUSES = EnumSet.of(
                ApplicationStatus.TECH_SCREEN,
                ApplicationStatus.TAKE_HOME,
                ApplicationStatus.SYSTEM_DESIGN,
                ApplicationStatus.TECHNICAL_I,
                ApplicationStatus.TECHNICAL_II,
                ApplicationStatus.REFERENCE_CHECK
        );
        TECH_STATUSES.addAll(OFFER_STATUSES);
    }

    /**
     * Status values that indicate the application reached any interview/screening stage.
     * INTERVIEW_STATUSES and SCREEN_STATUSES are semantically identical in this context,
     * so we consolidate them into a single set.
     *
     * <p>Includes recruiter screen + all technical stages + offer stages.</p>
     */
    private static final Set<ApplicationStatus> INTERVIEW_STATUSES;

    static {
        // INTERVIEW_STATUSES = RECRUITER_SCREEN + all TECH_STATUSES
        INTERVIEW_STATUSES = EnumSet.of(ApplicationStatus.RECRUITER_SCREEN);
        INTERVIEW_STATUSES.addAll(TECH_STATUSES);
    }

    /**
     * Alias for INTERVIEW_STATUSES to maintain semantic clarity in code.
     * Applications that "reached screening" is the same set as "reached interview"
     * in this application's context.
     */
    private static final Set<ApplicationStatus> SCREEN_STATUSES = INTERVIEW_STATUSES;

    /**
     * Status values that indicate the application received a response.
     * GHOSTED is intentionally excluded as it represents no response.
     *
     * <p>Includes all interview stages plus response-only statuses
     * (REJECTED, ON_HOLD, WAITING_FOR_RESPONSE).</p>
     */
    private static final Set<ApplicationStatus> RESPONSE_STATUSES;

    static {
        // RESPONSE_STATUSES = all interview stages + response-only statuses
        RESPONSE_STATUSES = EnumSet.copyOf(INTERVIEW_STATUSES);
        RESPONSE_STATUSES.add(ApplicationStatus.REJECTED);
        RESPONSE_STATUSES.add(ApplicationStatus.ON_HOLD);
        RESPONSE_STATUSES.add(ApplicationStatus.WAITING_FOR_RESPONSE);
    }

    /**
     * Terminal statuses that indicate an application is no longer active.
     * Used to filter out inactive applications from salary distribution calculations,
     * as these represent closed opportunities that shouldn't influence expected salary ranges.
     */
    private static final Set<ApplicationStatus> TERMINAL_STATUSES = EnumSet.of(
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
            ApplicationStatus.GHOSTED
    );

    /**
     * All terminal statuses including offer outcomes.
     * Used for funnel analytics and health indicator calculations.
     */
    private static final Set<ApplicationStatus> ALL_TERMINAL_STATUSES = EnumSet.of(
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
            ApplicationStatus.GHOSTED,
            ApplicationStatus.OFFER_ACCEPTED,
            ApplicationStatus.OFFER_DECLINED,
            ApplicationStatus.OFFER_RESCINDED
    );

    /**
     * Negative terminal statuses (rejection/failure outcomes).
     * Used for identifying quick losses in health indicators.
     */
    private static final Set<ApplicationStatus> NEGATIVE_TERMINAL_STATUSES = EnumSet.of(
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
            ApplicationStatus.GHOSTED,
            ApplicationStatus.OFFER_DECLINED,
            ApplicationStatus.OFFER_RESCINDED
    );

    /**
     * Default number of days to consider an application stale.
     */
    private static final int DEFAULT_STALE_DAYS = 14;

    /**
     * Number of days to look back for "hot" application activity.
     */
    private static final int HOT_ACTIVITY_WINDOW_DAYS = 7;

    /**
     * Minimum events in the hot activity window to be considered "hot".
     */
    private static final int HOT_EVENT_THRESHOLD = 3;

    /**
     * Maximum days from application to resolution to be a "quick" outcome.
     */
    private static final int QUICK_OUTCOME_DAYS = 7;

    /**
     * Maximum number of bottleneck stages to return in analytics.
     * Limits the response size while showing the most significant bottlenecks.
     */
    private static final int MAX_BOTTLENECK_STAGES = 5;

    @Override
    public MetricsResponse getMetrics(Long userId) {
        log.debug("Calculating metrics for user ID: {}", userId);

        List<JobApplication> applications = repository.findAllByUserId(userId);

        if (applications.isEmpty()) {
            return MetricsResponse.empty();
        }

        long total = applications.size();

        // Calculate response rate (moved past APPLIED, excluding GHOSTED and WITHDRAWN)
        long responded = applications.stream()
                .filter(app -> RESPONSE_STATUSES.contains(app.getStatus()))
                .count();
        double responseRate = (responded * 100.0) / total;

        // Calculate interview rate
        long interviewed = applications.stream()
                .filter(app -> INTERVIEW_STATUSES.contains(app.getStatus()))
                .count();
        double interviewRate = (interviewed * 100.0) / total;

        // Calculate offer rate
        long offers = applications.stream()
                .filter(app -> OFFER_STATUSES.contains(app.getStatus()))
                .count();
        double offerRate = (offers * 100.0) / total;

        // Calculate average days to response
        double avgDaysToResponse = calculateAvgDaysToResponse(applications);

        // Calculate weekly pace
        double weeklyPace = calculateWeeklyPace(applications);

        // Calculate stage conversions
        StageConversions conversions = calculateStageConversions(applications, total);

        return new MetricsResponse(
                roundToOneDecimal(responseRate),
                roundToOneDecimal(interviewRate),
                roundToOneDecimal(offerRate),
                roundToOneDecimal(avgDaysToResponse),
                roundToOneDecimal(weeklyPace),
                total,
                conversions
        );
    }

    /**
     * Calculates the average number of days from application to first response.
     *
     * <p>Only includes applications that have received a response (moved past APPLIED)
     * and where we can calculate the time difference between appliedDate and
     * statusChangedAt.</p>
     */
    private double calculateAvgDaysToResponse(List<JobApplication> applications) {
        List<Long> responseDays = applications.stream()
                .filter(app -> RESPONSE_STATUSES.contains(app.getStatus()))
                .filter(app -> app.getAppliedDate() != null && app.getStatusChangedAt() != null)
                .map(app -> ChronoUnit.DAYS.between(app.getAppliedDate(), app.getStatusChangedAt()))
                .filter(days -> days >= 0)
                .collect(Collectors.toList());

        if (responseDays.isEmpty()) {
            return 0.0;
        }

        return responseDays.stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0.0);
    }

    /**
     * Calculates the average number of applications per week.
     *
     * <p>Based on the date range from the earliest to most recent application.</p>
     */
    private double calculateWeeklyPace(List<JobApplication> applications) {
        if (applications.size() < 2) {
            return applications.size();
        }

        Instant earliest = applications.stream()
                .map(JobApplication::getAppliedDate)
                .filter(date -> date != null)
                .min(Instant::compareTo)
                .orElse(null);

        Instant latest = applications.stream()
                .map(JobApplication::getAppliedDate)
                .filter(date -> date != null)
                .max(Instant::compareTo)
                .orElse(null);

        if (earliest == null || latest == null) {
            return applications.size();
        }

        long days = ChronoUnit.DAYS.between(earliest, latest);
        if (days == 0) {
            return applications.size();
        }

        double weeks = days / 7.0;
        return weeks > 0 ? applications.size() / weeks : applications.size();
    }

    /**
     * Calculates conversion rates between pipeline stages.
     */
    private StageConversions calculateStageConversions(List<JobApplication> applications, long total) {
        if (total == 0) {
            return new StageConversions(0.0, 0.0, 0.0);
        }

        // Applied to Screen: % that made it to any screening stage
        long screened = applications.stream()
                .filter(app -> SCREEN_STATUSES.contains(app.getStatus()))
                .count();
        double appliedToScreen = (screened * 100.0) / total;

        // Screen to Tech: % of screened that made it to technical interviews
        long tech = applications.stream()
                .filter(app -> TECH_STATUSES.contains(app.getStatus()))
                .count();
        double screenToTech = screened > 0 ? (tech * 100.0) / screened : 0.0;

        // Tech to Offer: % of technical that got offers
        long offers = applications.stream()
                .filter(app -> OFFER_STATUSES.contains(app.getStatus()))
                .count();
        double techToOffer = tech > 0 ? (offers * 100.0) / tech : 0.0;

        return new StageConversions(
                roundToOneDecimal(appliedToScreen),
                roundToOneDecimal(screenToTech),
                roundToOneDecimal(techToOffer)
        );
    }

    @Override
    public Map<ApplicationStatus, Long> getCountsByStatus(Long userId) {
        log.debug("Getting counts by status for user ID: {}", userId);
        return repository.countByStatusForUser(userId);
    }

    @Override
    public SalaryDistributionResponse getSalaryDistribution(Long userId) {
        log.debug("Calculating salary distribution for user ID: {}", userId);

        List<JobApplication> applications = repository.findAllByUserId(userId);

        // Include only active applications (non-terminal) with at least one salary value.
        // Terminal statuses (REJECTED, WITHDRAWN, GHOSTED) are excluded because they
        // represent closed opportunities that shouldn't influence expected salary ranges.
        List<JobApplication> withSalary = applications.stream()
                .filter(app -> !TERMINAL_STATUSES.contains(app.getStatus()))
                .filter(app -> app.getSalaryMin() != null || app.getSalaryMax() != null)
                .collect(Collectors.toList());

        if (withSalary.isEmpty()) {
            return new SalaryDistributionResponse(null, null, null, null, null, 0L, List.of());
        }

        // For scatter entries, coalesce missing value to the available one so every
        // point has valid (x, y) coordinates. Apps with only one value appear on the diagonal.
        List<ApplicationSalaryEntry> entries = withSalary.stream()
                .map(app -> {
                    double min = app.getSalaryMin() != null ? app.getSalaryMin() : app.getSalaryMax();
                    double max = app.getSalaryMax() != null ? app.getSalaryMax() : app.getSalaryMin();
                    return new ApplicationSalaryEntry(app.getCompanyName(), min, max);
                })
                .collect(Collectors.toList());

        // Axis bounds derived from coalesced entry values
        Double globalMin = entries.stream()
                .mapToDouble(ApplicationSalaryEntry::salaryMin)
                .min().orElse(0);

        Double globalMax = entries.stream()
                .mapToDouble(ApplicationSalaryEntry::salaryMax)
                .max().orElse(0);

        // Average reference lines
        Double avgMin = entries.stream()
                .mapToDouble(ApplicationSalaryEntry::salaryMin)
                .average().orElse(0.0);

        Double avgMax = entries.stream()
                .mapToDouble(ApplicationSalaryEntry::salaryMax)
                .average().orElse(0.0);

        Double avgMid = (avgMin + avgMax) / 2.0;

        return new SalaryDistributionResponse(
                globalMin,
                globalMax,
                avgMin > 0 ? avgMin : null,
                avgMax > 0 ? avgMax : null,
                avgMid,
                (long) withSalary.size(),
                entries
        );
    }

    @Override
    public ActivityHeatmapResponse getActivityHeatmap(Long userId, Integer year) {
        log.debug("Getting activity heatmap for user ID: {} and year: {}", userId, year);

        List<JobApplication> applications = repository.findAllByUserId(userId);

        // Group by date and count, filtering by year
        Map<String, Integer> dateCounts = new TreeMap<>();
        int maxCount = 0;

        for (JobApplication app : applications) {
            if (app.getAppliedDate() == null) {
                continue;
            }

            LocalDate date = app.getAppliedDate()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();

            if (date.getYear() != year) {
                continue;
            }

            String dateStr = date.toString(); // ISO format YYYY-MM-DD
            int count = dateCounts.getOrDefault(dateStr, 0) + 1;
            dateCounts.put(dateStr, count);
            maxCount = Math.max(maxCount, count);
        }

        return new ActivityHeatmapResponse(dateCounts, maxCount, year);
    }

    @Override
    public TimePatternsResponse getTimePatterns(Long userId) {
        log.debug("Getting time patterns for user ID: {}", userId);

        List<JobApplication> applications = repository.findAllByUserId(userId);

        Map<DayOfWeek, Integer> byDayOfWeek = new EnumMap<>(DayOfWeek.class);
        Map<Integer, Integer> byHour = new TreeMap<>();

        for (JobApplication app : applications) {
            if (app.getAppliedDate() == null) {
                continue;
            }

            ZonedDateTime zdt = app.getAppliedDate().atZone(ZoneId.systemDefault());

            // Count by day of week
            DayOfWeek dayOfWeek = zdt.getDayOfWeek();
            byDayOfWeek.merge(dayOfWeek, 1, Integer::sum);

            // Count by hour
            int hour = zdt.getHour();
            byHour.merge(hour, 1, Integer::sum);
        }

        return new TimePatternsResponse(byDayOfWeek, byHour);
    }

    @Override
    public StageDurationsResponse getStageDurations(Long userId) {
        log.debug("Getting stage durations for user ID: {}", userId);

        List<JobApplication> applications = repository.findAllByUserId(userId);

        if (applications.isEmpty()) {
            return new StageDurationsResponse(new EnumMap<>(ApplicationStatus.class), List.of());
        }

        // Calculate average time spent in each stage
        // For simplicity, we use the time from appliedDate to statusChangedAt
        // This represents the time the application has been in its current stage
        // (or total time if still in APPLIED)
        Map<ApplicationStatus, List<Long>> durationsByStatus = new EnumMap<>(ApplicationStatus.class);

        Instant now = Instant.now();
        for (JobApplication app : applications) {
            if (app.getAppliedDate() == null) {
                continue;
            }

            // Calculate days in current stage
            // For applications still in APPLIED, use time since applied
            // For others, this is time until status changed
            long days;
            if (app.getStatus() == ApplicationStatus.APPLIED) {
                days = ChronoUnit.DAYS.between(app.getAppliedDate(), now);
            } else {
                days = ChronoUnit.DAYS.between(app.getAppliedDate(), app.getStatusChangedAt());
            }

            if (days < 0) {
                days = 0;
            }

            durationsByStatus
                    .computeIfAbsent(app.getStatus(), k -> new java.util.ArrayList<>())
                    .add(days);
        }

        // Calculate averages
        Map<ApplicationStatus, Double> averageTimeByStage = new EnumMap<>(ApplicationStatus.class);
        for (Map.Entry<ApplicationStatus, List<Long>> entry : durationsByStatus.entrySet()) {
            double avg = entry.getValue().stream()
                    .mapToLong(Long::longValue)
                    .average()
                    .orElse(0.0);
            averageTimeByStage.put(entry.getKey(), roundToOneDecimal(avg));
        }

        // Identify bottlenecks (stages with longest durations)
        List<BottleneckStage> bottleneckStages = averageTimeByStage.entrySet().stream()
                .map(e -> new BottleneckStage(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingDouble(BottleneckStage::avgDays).reversed())
                .limit(MAX_BOTTLENECK_STAGES)
                .collect(Collectors.toList());

        return new StageDurationsResponse(averageTimeByStage, bottleneckStages);
    }

    /**
     * Rounds a double value to one decimal place.
     */
    private double roundToOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    // ==================== Event-Based Analytics Methods ====================

    @Override
    public TransitionMatrixResponse getTransitionMatrix(Long userId) {
        log.debug("Calculating transition matrix for user ID: {}", userId);

        List<ApplicationEvent> statusEvents = eventRepository.findStatusTransitionsByUserId(userId);

        if (statusEvents.isEmpty()) {
            return TransitionMatrixResponse.empty();
        }

        // Group by (from, to) pairs and count occurrences
        // KEY: "FROM_STATUS->TO_STATUS"
        Map<String, Long> transitionCounts = new HashMap<>();
        Set<ApplicationStatus> allStatuses = new HashSet<>();

        for (ApplicationEvent event : statusEvents) {
            String oldValue = event.getOldValue();
            String newValue = event.getNewValue();

            if (oldValue == null || newValue == null) {
                continue;
            }

            try {
                ApplicationStatus fromStatus = ApplicationStatus.valueOf(oldValue);
                ApplicationStatus toStatus = ApplicationStatus.valueOf(newValue);

                String key = fromStatus.name() + "->" + toStatus.name();
                transitionCounts.merge(key, 1L, Long::sum);

                allStatuses.add(fromStatus);
                allStatuses.add(toStatus);
            } catch (IllegalArgumentException e) {
                // Skip invalid status values that may exist from legacy data
                log.warn("Skipping invalid status value in transition: {} -> {}", oldValue, newValue);
            }
        }

        // Convert to StatusTransition list
        List<StatusTransition> transitions = transitionCounts.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split("->");
                    ApplicationStatus from = ApplicationStatus.valueOf(parts[0]);
                    ApplicationStatus to = ApplicationStatus.valueOf(parts[1]);
                    return new StatusTransition(from, to, entry.getValue());
                })
                .sorted(Comparator.comparingLong(StatusTransition::count).reversed())
                .collect(Collectors.toList());

        long totalTransitions = transitions.stream()
                .mapToLong(StatusTransition::count)
                .sum();

        return new TransitionMatrixResponse(transitions, allStatuses, totalTransitions);
    }

    @Override
    public FunnelAnalyticsResponse getFunnelAnalytics(Long userId) {
        log.debug("Calculating funnel analytics for user ID: {}", userId);

        List<JobApplication> applications = repository.findAllByUserId(userId);

        if (applications.isEmpty()) {
            return FunnelAnalyticsResponse.empty();
        }

        long total = applications.size();

        // Calculate stage conversion rates - percentage advancing from each status
        Map<ApplicationStatus, Double> stageConversionRates = calculateStageConversionRates(applications, total);

        // Identify drop-off points (terminal statuses)
        List<DropOffPoint> dropOffPoints = calculateDropOffPoints(applications, total);

        // Calculate success rate by company
        List<CompanySuccessRate> successByCompany = calculateSuccessRateByCompany(applications);

        // Calculate success rate by position type
        List<PositionTypeSuccessRate> successByPosition = calculateSuccessRateByPositionType(applications);

        // Calculate overall success rate
        long offers = applications.stream()
                .filter(app -> OFFER_STATUSES.contains(app.getStatus()))
                .count();
        double overallSuccessRate = total > 0 ? roundToOneDecimal((offers * 100.0) / total) : 0.0;

        return new FunnelAnalyticsResponse(
                stageConversionRates,
                dropOffPoints,
                successByCompany,
                successByPosition,
                overallSuccessRate,
                total
        );
    }

    /**
     * Calculates the percentage of applications that advanced past each status.
     *
     * <p>For APPLIED status, this is the percentage of applications that moved
     * to any status other than APPLIED (i.e., received some response).</p>
     */
    private Map<ApplicationStatus, Double> calculateStageConversionRates(List<JobApplication> applications,
                                                                          long total) {
        Map<ApplicationStatus, Double> rates = new EnumMap<>(ApplicationStatus.class);

        if (total == 0) {
            return rates;
        }

        // Count applications NOT in APPLIED status (i.e., those that advanced)
        long advanced = applications.stream()
                .filter(app -> app.getStatus() != ApplicationStatus.APPLIED)
                .count();
        rates.put(ApplicationStatus.APPLIED, roundToOneDecimal((advanced * 100.0) / total));

        return rates;
    }

    /**
     * Identifies terminal statuses where applications commonly end.
     */
    private List<DropOffPoint> calculateDropOffPoints(List<JobApplication> applications, long total) {
        if (total == 0) {
            return List.of();
        }

        // Count applications in each terminal status
        Map<ApplicationStatus, Long> terminalCounts = applications.stream()
                .filter(app -> ALL_TERMINAL_STATUSES.contains(app.getStatus()))
                .collect(Collectors.groupingBy(JobApplication::getStatus, Collectors.counting()));

        return terminalCounts.entrySet().stream()
                .map(entry -> new DropOffPoint(
                        entry.getKey(),
                        entry.getValue(),
                        roundToOneDecimal((entry.getValue() * 100.0) / total)
                ))
                .sorted(Comparator.comparingLong(DropOffPoint::count).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Calculates offer success rate grouped by company name.
     */
    private List<CompanySuccessRate> calculateSuccessRateByCompany(List<JobApplication> applications) {
        // Group by company
        Map<String, List<JobApplication>> byCompany = applications.stream()
                .collect(Collectors.groupingBy(JobApplication::getCompanyName));

        return byCompany.entrySet().stream()
                .map(entry -> {
                    String company = entry.getKey();
                    List<JobApplication> companyApps = entry.getValue();
                    long companyTotal = companyApps.size();
                    long companyOffers = companyApps.stream()
                            .filter(app -> OFFER_STATUSES.contains(app.getStatus()))
                            .count();
                    double rate = companyTotal > 0 ? roundToOneDecimal((companyOffers * 100.0) / companyTotal) : 0.0;
                    return new CompanySuccessRate(company, companyTotal, companyOffers, rate);
                })
                .sorted(Comparator.comparingLong(CompanySuccessRate::totalApplications).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Calculates offer success rate grouped by position type (extracted from title).
     *
     * <p>Position types are extracted from common keywords in job titles:
     * Senior, Staff, Principal, Junior, Mid, Lead, etc.</p>
     */
    private List<PositionTypeSuccessRate> calculateSuccessRateByPositionType(List<JobApplication> applications) {
        // Extract position type from title using keywords
        Map<String, List<JobApplication>> byPositionType = applications.stream()
                .collect(Collectors.groupingBy(app -> extractPositionType(app.getPositionTitle())));

        return byPositionType.entrySet().stream()
                .filter(entry -> !entry.getKey().equals("Other")) // Optionally exclude uncategorized
                .map(entry -> {
                    String positionType = entry.getKey();
                    List<JobApplication> typeApps = entry.getValue();
                    long typeTotal = typeApps.size();
                    long typeOffers = typeApps.stream()
                            .filter(app -> OFFER_STATUSES.contains(app.getStatus()))
                            .count();
                    double rate = typeTotal > 0 ? roundToOneDecimal((typeOffers * 100.0) / typeTotal) : 0.0;
                    return new PositionTypeSuccessRate(positionType, typeTotal, typeOffers, rate);
                })
                .sorted(Comparator.comparingLong(PositionTypeSuccessRate::totalApplications).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Extracts seniority/position type from a job title.
     *
     * <p>Looks for common keywords like Senior, Staff, Junior, etc.
     * Returns "Other" if no recognizable keyword is found.</p>
     */
    private String extractPositionType(String title) {
        if (title == null) {
            return "Other";
        }
        String lowerTitle = title.toLowerCase();

        // Order matters: check more specific terms first
        if (lowerTitle.contains("principal")) return "Principal";
        if (lowerTitle.contains("staff")) return "Staff";
        if (lowerTitle.contains("senior") || lowerTitle.contains("sr.") || lowerTitle.contains("sr ")) return "Senior";
        if (lowerTitle.contains("lead")) return "Lead";
        if (lowerTitle.contains("junior") || lowerTitle.contains("jr.") || lowerTitle.contains("jr ")) return "Junior";
        if (lowerTitle.contains("mid-level") || lowerTitle.contains("mid level")) return "Mid-Level";
        if (lowerTitle.contains("intern")) return "Intern";
        if (lowerTitle.contains("entry")) return "Entry Level";

        return "Other";
    }

    @Override
    public ApplicationHealthResponse getApplicationHealth(Long userId, Integer staleDays) {
        log.debug("Calculating application health for user ID: {} with stale threshold: {} days",
                userId, staleDays);

        int effectiveStaleDays = staleDays != null ? staleDays : DEFAULT_STALE_DAYS;
        Instant now = Instant.now();

        List<JobApplication> applications = repository.findAllByUserId(userId);

        if (applications.isEmpty()) {
            return ApplicationHealthResponse.empty(effectiveStaleDays);
        }

        // Build lookup maps for applications
        Map<Long, JobApplication> appById = applications.stream()
                .collect(Collectors.toMap(JobApplication::getId, Function.identity()));

        // Get last event timestamps for all applications
        List<Object[]> lastEventData = eventRepository.findLastEventTimestampByApplicationForUser(userId);
        Map<Long, Instant> lastEventByAppId = lastEventData.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Instant) row[1]
                ));

        // Get recent event counts (last 7 days)
        Instant hotWindowStart = now.minus(HOT_ACTIVITY_WINDOW_DAYS, ChronoUnit.DAYS);
        List<Object[]> recentEventData = eventRepository.countRecentEventsByApplicationForUser(userId, hotWindowStart);
        Map<Long, Long> recentEventCountByAppId = recentEventData.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        // Identify stale applications
        List<StaleApplication> staleApplications = findStaleApplications(
                applications, lastEventByAppId, now, effectiveStaleDays);

        // Identify hot applications
        List<HotApplication> hotApplications = findHotApplications(
                applications, recentEventCountByAppId, lastEventByAppId);

        // Identify quick wins and losses
        List<QuickOutcome> quickWins = findQuickOutcomes(applications, true);
        List<QuickOutcome> quickLosses = findQuickOutcomes(applications, false);

        // Calculate active count (non-terminal statuses)
        int activeCount = (int) applications.stream()
                .filter(app -> !ALL_TERMINAL_STATUSES.contains(app.getStatus()))
                .count();

        HealthSummary summary = new HealthSummary(
                staleApplications.size(),
                hotApplications.size(),
                quickWins.size(),
                quickLosses.size(),
                activeCount
        );

        return new ApplicationHealthResponse(
                staleApplications,
                hotApplications,
                quickWins,
                quickLosses,
                effectiveStaleDays,
                summary
        );
    }

    /**
     * Finds applications that are stale (no activity for X days while still active).
     */
    private List<StaleApplication> findStaleApplications(List<JobApplication> applications,
                                                          Map<Long, Instant> lastEventByAppId,
                                                          Instant now,
                                                          int staleDays) {
        Instant staleThreshold = now.minus(staleDays, ChronoUnit.DAYS);
        List<StaleApplication> stale = new ArrayList<>();

        for (JobApplication app : applications) {
            // Skip terminal status applications
            if (ALL_TERMINAL_STATUSES.contains(app.getStatus())) {
                continue;
            }

            Instant lastEvent = lastEventByAppId.get(app.getId());
            if (lastEvent == null) {
                // No events found - use applied date as fallback
                lastEvent = app.getAppliedDate();
            }

            if (lastEvent != null && lastEvent.isBefore(staleThreshold)) {
                long daysSinceLastEvent = ChronoUnit.DAYS.between(lastEvent, now);
                stale.add(new StaleApplication(
                        app.getId(),
                        app.getCompanyName(),
                        app.getPositionTitle(),
                        app.getStatus(),
                        lastEvent,
                        daysSinceLastEvent
                ));
            }
        }

        // Sort by days since last event (most stale first)
        stale.sort(Comparator.comparingLong(StaleApplication::daysSinceLastEvent).reversed());
        return stale;
    }

    /**
     * Finds applications with high recent activity (3+ events in last 7 days).
     */
    private List<HotApplication> findHotApplications(List<JobApplication> applications,
                                                      Map<Long, Long> recentEventCountByAppId,
                                                      Map<Long, Instant> lastEventByAppId) {
        List<HotApplication> hot = new ArrayList<>();

        for (JobApplication app : applications) {
            Long recentCount = recentEventCountByAppId.get(app.getId());
            if (recentCount != null && recentCount >= HOT_EVENT_THRESHOLD) {
                Instant lastEvent = lastEventByAppId.getOrDefault(app.getId(), app.getStatusChangedAt());
                hot.add(new HotApplication(
                        app.getId(),
                        app.getCompanyName(),
                        app.getPositionTitle(),
                        app.getStatus(),
                        recentCount.intValue(),
                        lastEvent
                ));
            }
        }

        // Sort by recent event count (hottest first)
        hot.sort(Comparator.comparingInt(HotApplication::recentEventCount).reversed());
        return hot;
    }

    /**
     * Finds applications that resolved quickly (within 7 days).
     *
     * @param applications all applications
     * @param wins if true, find quick wins (offers); if false, find quick losses (rejections)
     * @return list of quick outcomes
     */
    private List<QuickOutcome> findQuickOutcomes(List<JobApplication> applications, boolean wins) {
        Set<ApplicationStatus> targetStatuses = wins ? OFFER_STATUSES : NEGATIVE_TERMINAL_STATUSES;
        List<QuickOutcome> outcomes = new ArrayList<>();

        for (JobApplication app : applications) {
            if (!targetStatuses.contains(app.getStatus())) {
                continue;
            }

            Instant appliedDate = app.getAppliedDate();
            Instant resolvedAt = app.getStatusChangedAt();

            if (appliedDate == null || resolvedAt == null) {
                continue;
            }

            long daysToResolution = ChronoUnit.DAYS.between(appliedDate, resolvedAt);

            if (daysToResolution <= QUICK_OUTCOME_DAYS && daysToResolution >= 0) {
                outcomes.add(new QuickOutcome(
                        app.getId(),
                        app.getCompanyName(),
                        app.getPositionTitle(),
                        app.getStatus(),
                        appliedDate,
                        resolvedAt,
                        daysToResolution
                ));
            }
        }

        // Sort by days to resolution (fastest first)
        outcomes.sort(Comparator.comparingLong(QuickOutcome::daysToResolution));
        return outcomes;
    }

    // ==================== Data Fusion Analytics Methods ====================

    /**
     * Default number of companies to return in company insights.
     */
    private static final int DEFAULT_TOP_N_COMPANIES = 10;

    @Override
    public CompanyInsightsResponse getCompanyInsights(Long userId, Integer topN) {
        log.debug("Calculating company insights for user ID: {} with topN: {}", userId, topN);

        List<JobApplication> applications = repository.findAllByUserId(userId);

        if (applications.isEmpty()) {
            return CompanyInsightsResponse.empty();
        }

        int effectiveTopN = topN != null ? topN : DEFAULT_TOP_N_COMPANIES;
        long totalApplications = applications.size();

        // Group applications by company name
        Map<String, List<JobApplication>> byCompany = applications.stream()
                .collect(Collectors.groupingBy(JobApplication::getCompanyName));

        int totalCompanies = byCompany.size();

        // Calculate metrics for each company
        List<CompanyMetrics> companyMetrics = byCompany.entrySet().stream()
                .map(entry -> calculateCompanyMetrics(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingLong(CompanyMetrics::applicationCount).reversed())
                .limit(effectiveTopN)
                .collect(Collectors.toList());

        return new CompanyInsightsResponse(companyMetrics, totalCompanies, totalApplications);
    }

    /**
     * Calculates metrics for a single company.
     *
     * <p>Computes response rate (percentage that received any response, excluding GHOSTED),
     * ghost rate (percentage ending in GHOSTED), interview rate (percentage reaching
     * interview stages), and average days to first response.</p>
     *
     * @param companyName the name of the company
     * @param companyApps list of applications to this company
     * @return CompanyMetrics with calculated values
     */
    private CompanyMetrics calculateCompanyMetrics(String companyName, List<JobApplication> companyApps) {
        long total = companyApps.size();

        // Response rate: applications in RESPONSE_STATUSES (any response received)
        long responded = companyApps.stream()
                .filter(app -> RESPONSE_STATUSES.contains(app.getStatus()))
                .count();
        double responseRate = total > 0 ? roundToOneDecimal((responded * 100.0) / total) : 0.0;

        // Ghost rate: applications ending in GHOSTED status
        long ghosted = companyApps.stream()
                .filter(app -> app.getStatus() == ApplicationStatus.GHOSTED)
                .count();
        double ghostRate = total > 0 ? roundToOneDecimal((ghosted * 100.0) / total) : 0.0;

        // Interview rate: applications that reached interview stages
        long interviewed = companyApps.stream()
                .filter(app -> INTERVIEW_STATUSES.contains(app.getStatus()))
                .count();
        double interviewRate = total > 0 ? roundToOneDecimal((interviewed * 100.0) / total) : 0.0;

        // Average days to response: only for applications that have responded
        Double avgDaysToResponse = calculateAvgDaysToResponseForApps(companyApps);

        return new CompanyMetrics(
                companyName,
                total,
                responseRate,
                ghostRate,
                interviewRate,
                avgDaysToResponse
        );
    }

    /**
     * Calculates the average number of days to first response for a subset of applications.
     *
     * <p>Only includes applications that have received a response (in RESPONSE_STATUSES)
     * and have valid appliedDate and statusChangedAt fields.</p>
     *
     * @param applications the applications to analyze
     * @return average days to response, or null if no valid data
     */
    private Double calculateAvgDaysToResponseForApps(List<JobApplication> applications) {
        List<Long> responseDays = applications.stream()
                .filter(app -> RESPONSE_STATUSES.contains(app.getStatus()))
                .filter(app -> app.getAppliedDate() != null && app.getStatusChangedAt() != null)
                .map(app -> ChronoUnit.DAYS.between(app.getAppliedDate(), app.getStatusChangedAt()))
                .filter(days -> days >= 0)
                .collect(Collectors.toList());

        if (responseDays.isEmpty()) {
            return null;
        }

        double avg = responseDays.stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0.0);
        return roundToOneDecimal(avg);
    }

    @Override
    public LocationInsightsResponse getLocationInsights(Long userId) {
        log.debug("Calculating location insights for user ID: {}", userId);

        List<JobApplication> applications = repository.findAllByUserId(userId);

        if (applications.isEmpty()) {
            return LocationInsightsResponse.empty();
        }

        long totalApplications = applications.size();

        // Calculate location-based metrics
        List<LocationMetrics> locationMetrics = calculateLocationMetrics(applications);

        // Calculate RTO type metrics
        List<RtoMetrics> rtoMetrics = calculateRtoMetrics(applications, totalApplications);

        return new LocationInsightsResponse(locationMetrics, rtoMetrics, totalApplications);
    }

    /**
     * Calculates metrics grouped by geographic location.
     *
     * <p>Null locations are grouped under "Not Specified". Metrics include
     * application count, average salary range, and success rate.</p>
     *
     * @param applications all applications to analyze
     * @return list of LocationMetrics sorted by application count
     */
    private List<LocationMetrics> calculateLocationMetrics(List<JobApplication> applications) {
        // Group by location, treating null as "Not Specified"
        Map<String, List<JobApplication>> byLocation = applications.stream()
                .collect(Collectors.groupingBy(
                        app -> app.getLocation() != null ? app.getLocation() : "Not Specified"
                ));

        return byLocation.entrySet().stream()
                .map(entry -> {
                    String location = entry.getKey();
                    List<JobApplication> locationApps = entry.getValue();
                    long count = locationApps.size();

                    // Calculate average salaries
                    Double avgSalaryMin = calculateAverageSalaryMin(locationApps);
                    Double avgSalaryMax = calculateAverageSalaryMax(locationApps);

                    // Calculate success rate (offers / total * 100)
                    long offers = locationApps.stream()
                            .filter(app -> OFFER_STATUSES.contains(app.getStatus()))
                            .count();
                    double successRate = count > 0 ? roundToOneDecimal((offers * 100.0) / count) : 0.0;

                    return new LocationMetrics(location, count, avgSalaryMin, avgSalaryMax, successRate);
                })
                .sorted(Comparator.comparingLong(LocationMetrics::applicationCount).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Calculates metrics grouped by RTO (Return-to-Office) type.
     *
     * <p>Null RTO types are grouped under "Not Specified". Metrics include
     * application count, percentage of total, average salary range, and success rate.</p>
     *
     * @param applications all applications to analyze
     * @param totalApplications total number of applications for percentage calculation
     * @return list of RtoMetrics sorted by application count
     */
    private List<RtoMetrics> calculateRtoMetrics(List<JobApplication> applications, long totalApplications) {
        // Group by RTO type, treating null as "Not Specified"
        Map<String, List<JobApplication>> byRtoType = applications.stream()
                .collect(Collectors.groupingBy(
                        app -> app.getRtoType() != null ? app.getRtoType().name() : "Not Specified"
                ));

        return byRtoType.entrySet().stream()
                .map(entry -> {
                    String rtoType = entry.getKey();
                    List<JobApplication> rtoApps = entry.getValue();
                    long count = rtoApps.size();

                    // Calculate percentage of total applications
                    double percentage = totalApplications > 0
                            ? roundToOneDecimal((count * 100.0) / totalApplications) : 0.0;

                    // Calculate average salaries
                    Double avgSalaryMin = calculateAverageSalaryMin(rtoApps);
                    Double avgSalaryMax = calculateAverageSalaryMax(rtoApps);

                    // Calculate success rate
                    long offers = rtoApps.stream()
                            .filter(app -> OFFER_STATUSES.contains(app.getStatus()))
                            .count();
                    double successRate = count > 0 ? roundToOneDecimal((offers * 100.0) / count) : 0.0;

                    return new RtoMetrics(rtoType, count, percentage, avgSalaryMin, avgSalaryMax, successRate);
                })
                .sorted(Comparator.comparingLong(RtoMetrics::applicationCount).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public PositionInsightsResponse getPositionInsights(Long userId) {
        log.debug("Calculating position insights for user ID: {}", userId);

        List<JobApplication> applications = repository.findAllByUserId(userId);

        if (applications.isEmpty()) {
            return PositionInsightsResponse.empty();
        }

        long totalApplications = applications.size();

        // Group by Level enum, treating null as "Not Specified"
        Map<String, List<JobApplication>> byLevel = applications.stream()
                .collect(Collectors.groupingBy(
                        app -> app.getLevel() != null ? app.getLevel().name() : "Not Specified"
                ));

        List<LevelMetrics> levelMetrics = byLevel.entrySet().stream()
                .map(entry -> calculateLevelMetrics(entry.getKey(), entry.getValue(), totalApplications))
                .sorted(Comparator.comparingLong(LevelMetrics::applicationCount).reversed())
                .collect(Collectors.toList());

        return new PositionInsightsResponse(levelMetrics, totalApplications);
    }

    /**
     * Calculates metrics for a single position level.
     *
     * <p>Computes percentage of total applications, success rate (offers),
     * interview rate, and average salary range.</p>
     *
     * @param level the position level name
     * @param levelApps applications at this level
     * @param totalApplications total applications for percentage calculation
     * @return LevelMetrics with calculated values
     */
    private LevelMetrics calculateLevelMetrics(String level, List<JobApplication> levelApps, long totalApplications) {
        long count = levelApps.size();

        // Calculate percentage of total
        double percentage = totalApplications > 0
                ? roundToOneDecimal((count * 100.0) / totalApplications) : 0.0;

        // Calculate success rate (offers / total * 100)
        long offers = levelApps.stream()
                .filter(app -> OFFER_STATUSES.contains(app.getStatus()))
                .count();
        double successRate = count > 0 ? roundToOneDecimal((offers * 100.0) / count) : 0.0;

        // Calculate interview rate
        long interviewed = levelApps.stream()
                .filter(app -> INTERVIEW_STATUSES.contains(app.getStatus()))
                .count();
        double interviewRate = count > 0 ? roundToOneDecimal((interviewed * 100.0) / count) : 0.0;

        // Calculate average salaries
        Double avgSalaryMin = calculateAverageSalaryMin(levelApps);
        Double avgSalaryMax = calculateAverageSalaryMax(levelApps);

        return new LevelMetrics(level, count, percentage, successRate, interviewRate, avgSalaryMin, avgSalaryMax);
    }

    /**
     * Calculates the average minimum salary from applications with salary data.
     *
     * @param applications the applications to analyze
     * @return average salaryMin, or null if no salary data exists
     */
    private Double calculateAverageSalaryMin(List<JobApplication> applications) {
        List<Double> salaries = applications.stream()
                .filter(app -> app.getSalaryMin() != null)
                .map(JobApplication::getSalaryMin)
                .collect(Collectors.toList());

        if (salaries.isEmpty()) {
            return null;
        }

        return roundToOneDecimal(salaries.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0));
    }

    /**
     * Calculates the average maximum salary from applications with salary data.
     *
     * @param applications the applications to analyze
     * @return average salaryMax, or null if no salary data exists
     */
    private Double calculateAverageSalaryMax(List<JobApplication> applications) {
        List<Double> salaries = applications.stream()
                .filter(app -> app.getSalaryMax() != null)
                .map(JobApplication::getSalaryMax)
                .collect(Collectors.toList());

        if (salaries.isEmpty()) {
            return null;
        }

        return roundToOneDecimal(salaries.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0));
    }
}
