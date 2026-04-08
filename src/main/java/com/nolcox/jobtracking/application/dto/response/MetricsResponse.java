package com.nolcox.jobtracking.application.dto.response;

/**
 * Response DTO for job application metrics endpoint.
 *
 * <p>Contains aggregated statistics about a user's job search progress,
 * including response rates, interview rates, and timing metrics. These
 * metrics help users understand their job search effectiveness and pace.</p>
 *
 * @param trueResponseRate percentage of applications that received any response (moved past APPLIED status)
 * @param trueInterviewRate percentage of applications reaching interview stages
 * @param trueOfferRate percentage of applications receiving offers
 * @param avgDaysToResponse average number of days from application to first status change
 * @param weeklyPace average applications submitted per week based on the user's activity date range
 * @param totalApplications total number of applications submitted by the user
 * @param stageConversions conversion rates between different application stages
 */
public record MetricsResponse(
        Double trueResponseRate,
        Double trueInterviewRate,
        Double trueOfferRate,
        Double avgDaysToResponse,
        Double weeklyPace,
        Long totalApplications,
        StageConversions stageConversions
) {
    /**
     * Creates an empty MetricsResponse with all values zeroed out.
     *
     * <p>Use this factory method when the user has no applications,
     * rather than creating a new instance with all zeros inline.</p>
     *
     * @return a MetricsResponse with all zero/empty values
     */
    public static MetricsResponse empty() {
        return new MetricsResponse(
                0.0, 0.0, 0.0, 0.0, 0.0, 0L,
                StageConversions.empty()
        );
    }

    /**
     * Conversion rates between major pipeline stages.
     *
     * <p>Each value represents the percentage of applications that successfully
     * progressed from one stage to the next.</p>
     *
     * @param appliedToScreen percentage of APPLIED applications that reached any screening stage
     * @param screenToTech percentage of screened applications that reached technical interviews
     * @param techToOffer percentage of technical interview applications that received offers
     */
    public record StageConversions(
            Double appliedToScreen,
            Double screenToTech,
            Double techToOffer
    ) {
        /**
         * Creates an empty StageConversions with all zero values.
         *
         * @return a StageConversions with all zero conversion rates
         */
        public static StageConversions empty() {
            return new StageConversions(0.0, 0.0, 0.0);
        }
    }
}
