package com.nolcox.jobtracking.application.dto.response;

import java.util.List;

/**
 * Response DTO for position level analytics insights.
 *
 * <p>Provides detailed metrics about application performance grouped by seniority
 * level (JUNIOR, MID, SENIOR, STAFF, PRINCIPAL, LEAD, MANAGER, DIRECTOR, VP).
 * This analysis helps job seekers understand their success rates at different
 * levels and optimize their targeting strategy.</p>
 *
 * @param byLevel list of metrics grouped by position level
 * @param totalApplicationsAnalyzed total number of applications included in analysis
 */
public record PositionInsightsResponse(
        List<LevelMetrics> byLevel,
        long totalApplicationsAnalyzed
) {
    /**
     * Metrics aggregated by position level.
     *
     * <p>Level is derived from the JobApplication.level field directly.
     * Applications with null level are grouped under "Not Specified".</p>
     *
     * @param level the position level (e.g., "SENIOR", "STAFF") or "Not Specified"
     * @param applicationCount number of applications at this level
     * @param percentage percentage of total applications at this level (0-100)
     * @param successRate percentage of applications resulting in offers (0-100)
     * @param interviewRate percentage of applications reaching interview stages (0-100)
     * @param avgSalaryMin average minimum salary; null if no salary data
     * @param avgSalaryMax average maximum salary; null if no salary data
     */
    public record LevelMetrics(
            String level,
            long applicationCount,
            double percentage,
            double successRate,
            double interviewRate,
            Double avgSalaryMin,
            Double avgSalaryMax
    ) {}

    /**
     * Creates an empty PositionInsightsResponse for users with no applications.
     *
     * @return a PositionInsightsResponse with empty data
     */
    public static PositionInsightsResponse empty() {
        return new PositionInsightsResponse(List.of(), 0L);
    }
}
