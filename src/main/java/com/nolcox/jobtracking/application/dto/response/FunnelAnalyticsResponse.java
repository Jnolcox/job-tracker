package com.nolcox.jobtracking.application.dto.response;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for the funnel analytics endpoint.
 *
 * <p>Provides comprehensive funnel metrics including stage conversion rates,
 * drop-off analysis, and success rates segmented by company and position type.
 * This data helps users understand where in the pipeline they lose opportunities
 * and which companies/roles have better outcomes.</p>
 *
 * @param stageConversionRates percentage of applications advancing from each status
 * @param dropOffPoints statuses where applications most commonly terminate
 * @param successRateByCompany offer rate grouped by company name
 * @param successRateByPositionType offer rate grouped by position title keywords
 * @param overallSuccessRate overall percentage of applications resulting in offers
 * @param totalApplicationsAnalyzed total applications included in the analysis
 */
public record FunnelAnalyticsResponse(
        Map<ApplicationStatus, Double> stageConversionRates,
        List<DropOffPoint> dropOffPoints,
        List<CompanySuccessRate> successRateByCompany,
        List<PositionTypeSuccessRate> successRateByPositionType,
        Double overallSuccessRate,
        Long totalApplicationsAnalyzed
) {
    /**
     * Represents a status where applications frequently terminate.
     *
     * <p>A drop-off point is a terminal status (REJECTED, WITHDRAWN, GHOSTED,
     * OFFER_DECLINED, OFFER_RESCINDED) with a significant number of applications
     * ending in that state.</p>
     *
     * @param status the terminal status
     * @param count number of applications that ended in this status
     * @param percentage percentage of total applications that ended here
     */
    public record DropOffPoint(
            ApplicationStatus status,
            Long count,
            Double percentage
    ) {}

    /**
     * Success rate metrics for a specific company.
     *
     * @param companyName name of the company
     * @param totalApplications number of applications to this company
     * @param offersReceived number of offers received from this company
     * @param successRate percentage of applications resulting in offers
     */
    public record CompanySuccessRate(
            String companyName,
            Long totalApplications,
            Long offersReceived,
            Double successRate
    ) {}

    /**
     * Success rate metrics for a position type category.
     *
     * <p>Position types are derived from common keywords in position titles
     * (e.g., "Senior", "Staff", "Frontend", "Backend", "Full Stack").</p>
     *
     * @param positionType the categorized position type
     * @param totalApplications number of applications for this position type
     * @param offersReceived number of offers received for this position type
     * @param successRate percentage of applications resulting in offers
     */
    public record PositionTypeSuccessRate(
            String positionType,
            Long totalApplications,
            Long offersReceived,
            Double successRate
    ) {}

    /**
     * Creates an empty FunnelAnalyticsResponse for users with no applications.
     *
     * @return a FunnelAnalyticsResponse with empty data
     */
    public static FunnelAnalyticsResponse empty() {
        return new FunnelAnalyticsResponse(
                Map.of(),
                List.of(),
                List.of(),
                List.of(),
                0.0,
                0L
        );
    }
}
