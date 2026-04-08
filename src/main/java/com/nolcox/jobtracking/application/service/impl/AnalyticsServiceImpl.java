package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.response.ActivityHeatmapResponse;
import com.nolcox.jobtracking.application.dto.response.MetricsResponse;
import com.nolcox.jobtracking.application.dto.response.MetricsResponse.StageConversions;
import com.nolcox.jobtracking.application.dto.response.SalaryDistributionResponse;
import com.nolcox.jobtracking.application.dto.response.StageDurationsResponse;
import com.nolcox.jobtracking.application.dto.response.StageDurationsResponse.BottleneckStage;
import com.nolcox.jobtracking.application.dto.response.TimePatternsResponse;
import com.nolcox.jobtracking.application.service.AnalyticsService;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
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
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
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
     * Terminal statuses where applications are no longer active.
     * These are excluded from salary distribution calculations.
     */
    private static final Set<ApplicationStatus> TERMINAL_STATUSES = EnumSet.of(
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
            ApplicationStatus.GHOSTED,
            ApplicationStatus.OFFER_DECLINED,
            ApplicationStatus.OFFER_RESCINDED
    );

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

        // Filter to active applications with salary data
        List<JobApplication> activeWithSalary = applications.stream()
                .filter(app -> !TERMINAL_STATUSES.contains(app.getStatus()))
                .filter(app -> app.getSalaryMin() != null || app.getSalaryMax() != null)
                .collect(Collectors.toList());

        if (activeWithSalary.isEmpty()) {
            return new SalaryDistributionResponse(null, null, null, null, null, 0L);
        }

        // Calculate global min/max
        Double globalMin = activeWithSalary.stream()
                .map(JobApplication::getSalaryMin)
                .filter(salary -> salary != null)
                .min(Double::compareTo)
                .orElse(null);

        Double globalMax = activeWithSalary.stream()
                .map(JobApplication::getSalaryMax)
                .filter(salary -> salary != null)
                .max(Double::compareTo)
                .orElse(null);

        // Calculate averages
        Double avgMin = activeWithSalary.stream()
                .map(JobApplication::getSalaryMin)
                .filter(salary -> salary != null)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        Double avgMax = activeWithSalary.stream()
                .map(JobApplication::getSalaryMax)
                .filter(salary -> salary != null)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        // Calculate midpoint average
        Double avgMid = (avgMin > 0 || avgMax > 0) ? (avgMin + avgMax) / 2 : null;

        return new SalaryDistributionResponse(
                globalMin,
                globalMax,
                avgMin > 0 ? avgMin : null,
                avgMax > 0 ? avgMax : null,
                avgMid,
                (long) activeWithSalary.size()
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
            Instant endDate = app.getStatusChangedAt() != null
                    ? app.getStatusChangedAt()
                    : now;

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
}
