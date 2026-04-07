package com.nolcox.jobtracking.application.service;

import com.nolcox.jobtracking.application.dto.response.ActivityHeatmapResponse;
import com.nolcox.jobtracking.application.dto.response.MetricsResponse;
import com.nolcox.jobtracking.application.dto.response.SalaryDistributionResponse;
import com.nolcox.jobtracking.application.dto.response.StageDurationsResponse;
import com.nolcox.jobtracking.application.dto.response.TimePatternsResponse;
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
}
