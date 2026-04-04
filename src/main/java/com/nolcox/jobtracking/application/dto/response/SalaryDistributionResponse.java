package com.nolcox.jobtracking.application.dto.response;

/**
 * Response DTO for salary distribution analytics endpoint.
 *
 * <p>Provides statistical analysis of salary data from active job applications.
 * Only includes applications that are not in terminal states (rejected, withdrawn, ghosted)
 * and have salary information available.</p>
 *
 * @param globalMin the lowest salary minimum across all active applications with salary data
 * @param globalMax the highest salary maximum across all active applications with salary data
 * @param avgMin the average of all salary minimums
 * @param avgMax the average of all salary maximums
 * @param avgMid the average midpoint salary ((avgMin + avgMax) / 2)
 * @param activeAppsWithSalary count of active applications that have salary data
 */
public record SalaryDistributionResponse(
        Double globalMin,
        Double globalMax,
        Double avgMin,
        Double avgMax,
        Double avgMid,
        Long activeAppsWithSalary
) {}
