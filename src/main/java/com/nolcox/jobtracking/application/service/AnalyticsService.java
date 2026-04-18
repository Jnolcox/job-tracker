package com.nolcox.jobtracking.application.service;

import com.nolcox.jobtracking.application.dto.response.ActivityHeatmapResponse;
import com.nolcox.jobtracking.application.dto.response.ApplicationHealthResponse;
import com.nolcox.jobtracking.application.dto.response.CompanyInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.FunnelAnalyticsResponse;
import com.nolcox.jobtracking.application.dto.response.LocationInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.MetricsResponse;
import com.nolcox.jobtracking.application.dto.response.PositionInsightsResponse;
import com.nolcox.jobtracking.application.dto.response.SalaryDistributionResponse;
import com.nolcox.jobtracking.application.dto.response.StageDurationsResponse;
import com.nolcox.jobtracking.application.dto.response.TimePatternsResponse;
import com.nolcox.jobtracking.application.dto.response.TransitionMatrixResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;

import java.util.Map;

/**
 * Service interface for job application analytics and metrics.
 *
 * <p>Provides aggregated statistics and analytics about a user's job search,
 * including response rates, timing metrics, salary distributions, and
 * application patterns. All methods filter data by the authenticated user.</p>
 */
public interface AnalyticsService {

    /**
     * Retrieves comprehensive metrics about a user's job search.
     *
     * <p>Calculates response rates, interview rates, offer rates, average
     * response time, and weekly application pace.</p>
     *
     * @param userId the ID of the user whose metrics to retrieve
     * @return MetricsResponse containing aggregated metrics
     */
    MetricsResponse getMetrics(Long userId);

    /**
     * Retrieves application counts grouped by status.
     *
     * <p>Returns a map where each key is an ApplicationStatus and the value
     * is the count of applications in that status.</p>
     *
     * @param userId the ID of the user whose counts to retrieve
     * @return Map of ApplicationStatus to count
     */
    Map<ApplicationStatus, Long> getCountsByStatus(Long userId);

    /**
     * Retrieves salary distribution statistics for active applications.
     *
     * <p>Only includes applications that are not in terminal states
     * (REJECTED, WITHDRAWN, GHOSTED) and have salary information.</p>
     *
     * @param userId the ID of the user whose salary data to analyze
     * @return SalaryDistributionResponse with salary statistics
     */
    SalaryDistributionResponse getSalaryDistribution(Long userId);

    /**
     * Retrieves application activity data for heatmap visualization.
     *
     * <p>Returns application counts grouped by date for the specified year.</p>
     *
     * @param userId the ID of the user whose activity to retrieve
     * @param year the year to filter by
     * @return ActivityHeatmapResponse with date-based counts
     */
    ActivityHeatmapResponse getActivityHeatmap(Long userId, Integer year);

    /**
     * Retrieves time-based patterns in application submissions.
     *
     * <p>Analyzes when the user typically submits applications, broken
     * down by day of week and hour of day.</p>
     *
     * @param userId the ID of the user whose patterns to analyze
     * @return TimePatternsResponse with day and hour distributions
     */
    TimePatternsResponse getTimePatterns(Long userId);

    /**
     * Retrieves average time spent in each application stage.
     *
     * <p>Calculates the average duration applications spend in each status
     * and identifies bottleneck stages.</p>
     *
     * @param userId the ID of the user whose stage durations to analyze
     * @return StageDurationsResponse with duration statistics and bottlenecks
     */
    StageDurationsResponse getStageDurations(Long userId);

    // ==================== Event-Based Analytics ====================

    /**
     * Retrieves the status transition matrix for heatmap visualization.
     *
     * <p>Analyzes all status change events to count transitions between
     * different application statuses. This data is suitable for rendering
     * as a heatmap where rows are "from" statuses, columns are "to" statuses,
     * and cell values represent transition counts.</p>
     *
     * @param userId the ID of the user whose transitions to analyze
     * @return TransitionMatrixResponse with transition counts and unique statuses
     */
    TransitionMatrixResponse getTransitionMatrix(Long userId);

    /**
     * Retrieves funnel analytics showing conversion rates and drop-off points.
     *
     * <p>Calculates stage-by-stage conversion rates, identifies where applications
     * most commonly terminate (drop-off points), and provides success rates
     * segmented by company and position type.</p>
     *
     * @param userId the ID of the user whose funnel to analyze
     * @return FunnelAnalyticsResponse with conversion rates and success metrics
     */
    FunnelAnalyticsResponse getFunnelAnalytics(Long userId);

    /**
     * Retrieves application health indicators.
     *
     * <p>Identifies applications in various states of health:</p>
     * <ul>
     *   <li><b>Stale</b>: Active applications with no events in X days (default 14)</li>
     *   <li><b>Hot</b>: Applications with 3+ events in the last 7 days</li>
     *   <li><b>Quick Wins</b>: Applications that received offers within 7 days</li>
     *   <li><b>Quick Losses</b>: Applications rejected/ghosted within 7 days</li>
     * </ul>
     *
     * @param userId the ID of the user whose application health to analyze
     * @param staleDays number of days without events to consider an application stale (null = 14)
     * @return ApplicationHealthResponse with categorized applications and summary
     */
    ApplicationHealthResponse getApplicationHealth(Long userId, Integer staleDays);

    // ==================== Data Fusion Analytics ====================

    /**
     * Retrieves company-level analytics insights.
     *
     * <p>Provides detailed metrics about application performance grouped by company,
     * including response rates, ghost rates, interview rates, and average time to response.
     * Results are sorted by application count (descending) and limited to topN companies.</p>
     *
     * @param userId the ID of the user whose company insights to analyze
     * @param topN maximum number of companies to return (null defaults to 10)
     * @return CompanyInsightsResponse with per-company metrics
     */
    CompanyInsightsResponse getCompanyInsights(Long userId, Integer topN);

    /**
     * Retrieves location and RTO type analytics insights.
     *
     * <p>Provides detailed metrics grouped by geographic location and work arrangement
     * (remote, hybrid, onsite). Includes average salaries and success rates for each
     * location and RTO type.</p>
     *
     * @param userId the ID of the user whose location insights to analyze
     * @return LocationInsightsResponse with location and RTO metrics
     */
    LocationInsightsResponse getLocationInsights(Long userId);

    /**
     * Retrieves position level analytics insights.
     *
     * <p>Provides detailed metrics grouped by seniority level (JUNIOR, MID, SENIOR,
     * STAFF, PRINCIPAL, etc.). Includes success rates, interview rates, and salary
     * data for each level.</p>
     *
     * @param userId the ID of the user whose position insights to analyze
     * @return PositionInsightsResponse with per-level metrics
     */
    PositionInsightsResponse getPositionInsights(Long userId);
}
