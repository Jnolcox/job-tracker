package com.nolcox.jobtracking.application.dto.response;

import java.util.List;

/**
 * Response DTO for location-based and RTO (Return-to-Office) analytics insights.
 *
 * <p>Provides detailed metrics about application performance grouped by geographic
 * location and work arrangement type. This analysis helps job seekers understand
 * salary expectations and success rates across different locations and remote work
 * arrangements.</p>
 *
 * @param byLocation list of metrics grouped by geographic location
 * @param byRtoType list of metrics grouped by RTO type (REMOTE, HYBRID, ONSITE)
 * @param totalApplicationsAnalyzed total number of applications included in analysis
 */
public record LocationInsightsResponse(
        List<LocationMetrics> byLocation,
        List<RtoMetrics> byRtoType,
        long totalApplicationsAnalyzed
) {
    /**
     * Metrics aggregated by geographic location.
     *
     * <p>Locations with null values are grouped under "Not Specified".</p>
     *
     * @param location geographic location string (e.g., "San Francisco, CA")
     *                 or "Not Specified" for applications without location data
     * @param applicationCount number of applications for this location
     * @param avgSalaryMin average minimum salary across applications with salary data;
     *                     null if no applications have salary data
     * @param avgSalaryMax average maximum salary across applications with salary data;
     *                     null if no applications have salary data
     * @param successRate percentage of applications resulting in offers (0-100)
     */
    public record LocationMetrics(
            String location,
            long applicationCount,
            Double avgSalaryMin,
            Double avgSalaryMax,
            double successRate
    ) {}

    /**
     * Metrics aggregated by RTO (Return-to-Office) type.
     *
     * <p>RTO types include REMOTE, HYBRID_2, HYBRID_3, HYBRID_4, and ONSITE.
     * Applications with null RTO type are grouped under "Not Specified".</p>
     *
     * @param rtoType the work arrangement type or "Not Specified"
     * @param applicationCount number of applications with this RTO type
     * @param percentage percentage of total applications with this RTO type (0-100)
     * @param avgSalaryMin average minimum salary; null if no salary data
     * @param avgSalaryMax average maximum salary; null if no salary data
     * @param successRate percentage of applications resulting in offers (0-100)
     */
    public record RtoMetrics(
            String rtoType,
            long applicationCount,
            double percentage,
            Double avgSalaryMin,
            Double avgSalaryMax,
            double successRate
    ) {}

    /**
     * Creates an empty LocationInsightsResponse for users with no applications.
     *
     * @return a LocationInsightsResponse with empty data
     */
    public static LocationInsightsResponse empty() {
        return new LocationInsightsResponse(List.of(), List.of(), 0L);
    }
}
