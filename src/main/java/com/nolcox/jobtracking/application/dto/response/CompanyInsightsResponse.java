package com.nolcox.jobtracking.application.dto.response;

import java.util.List;

/**
 * Response DTO for company-level analytics insights.
 *
 * <p>Provides detailed metrics about application performance grouped by company,
 * enabling users to understand which companies respond most frequently, which tend
 * to ghost applicants, and how long responses typically take.</p>
 *
 * <p>This analysis helps job seekers identify patterns in company behavior and
 * optimize their application strategy accordingly.</p>
 *
 * @param companies list of company metrics sorted by application count (descending)
 * @param totalCompaniesAnalyzed number of unique companies included in the analysis
 * @param totalApplicationsAnalyzed total number of applications across all companies
 */
public record CompanyInsightsResponse(
        List<CompanyMetrics> companies,
        int totalCompaniesAnalyzed,
        long totalApplicationsAnalyzed
) {
    /**
     * Detailed metrics for a specific company.
     *
     * <p>All rate fields are percentages (0-100) calculated relative to the
     * total applications submitted to this company.</p>
     *
     * @param companyName name of the company
     * @param applicationCount total applications submitted to this company
     * @param responseRate percentage of applications that received any response
     *                     (moved beyond APPLIED status, excluding GHOSTED)
     * @param ghostRate percentage of applications that ended in GHOSTED status
     * @param interviewRate percentage of applications that reached interview stages
     *                      (RECRUITER_SCREEN or beyond)
     * @param avgDaysToResponse average number of days from application to first
     *                          status change for applications that received responses;
     *                          null if no applications have response data
     */
    public record CompanyMetrics(
            String companyName,
            long applicationCount,
            double responseRate,
            double ghostRate,
            double interviewRate,
            Double avgDaysToResponse
    ) {}

    /**
     * Creates an empty CompanyInsightsResponse for users with no applications.
     *
     * <p>Returns a response with empty company list and zero counts, suitable
     * for new users or users who have deleted all their applications.</p>
     *
     * @return a CompanyInsightsResponse with no data
     */
    public static CompanyInsightsResponse empty() {
        return new CompanyInsightsResponse(List.of(), 0, 0L);
    }
}
