package com.nolcox.jobtracking.application.dto.response;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for the application health analytics endpoint.
 *
 * <p>Provides health indicators for a user's job applications, categorizing
 * them into actionable groups:</p>
 * <ul>
 *   <li><b>Stale Applications</b>: Active applications with no activity for an extended period</li>
 *   <li><b>Hot Applications</b>: Applications with high recent activity, requiring attention</li>
 *   <li><b>Quick Wins</b>: Applications that resulted in offers within 7 days</li>
 *   <li><b>Quick Losses</b>: Applications that were rejected/ghosted within 7 days</li>
 * </ul>
 *
 * @param staleApplications applications with no events in X days while in active status
 * @param hotApplications applications with 3+ events in the last 7 days
 * @param quickWins applications that received offers within 7 days of applying
 * @param quickLosses applications that terminated negatively within 7 days of applying
 * @param staleDaysThreshold the number of days used to determine staleness
 * @param summary aggregate counts for quick dashboard display
 */
public record ApplicationHealthResponse(
        List<StaleApplication> staleApplications,
        List<HotApplication> hotApplications,
        List<QuickOutcome> quickWins,
        List<QuickOutcome> quickLosses,
        Integer staleDaysThreshold,
        HealthSummary summary
) {
    /**
     * Represents an application that has gone stale (no recent activity).
     *
     * @param applicationId the application's unique identifier
     * @param companyName the company name for display
     * @param positionTitle the position title for display
     * @param currentStatus the application's current status
     * @param lastEventAt timestamp of the most recent event
     * @param daysSinceLastEvent number of days since the last event
     */
    public record StaleApplication(
            Long applicationId,
            String companyName,
            String positionTitle,
            ApplicationStatus currentStatus,
            Instant lastEventAt,
            Long daysSinceLastEvent
    ) {}

    /**
     * Represents an application with high recent activity.
     *
     * @param applicationId the application's unique identifier
     * @param companyName the company name for display
     * @param positionTitle the position title for display
     * @param currentStatus the application's current status
     * @param recentEventCount number of events in the last 7 days
     * @param lastEventAt timestamp of the most recent event
     */
    public record HotApplication(
            Long applicationId,
            String companyName,
            String positionTitle,
            ApplicationStatus currentStatus,
            Integer recentEventCount,
            Instant lastEventAt
    ) {}

    /**
     * Represents an application that resolved quickly (win or loss).
     *
     * @param applicationId the application's unique identifier
     * @param companyName the company name for display
     * @param positionTitle the position title for display
     * @param finalStatus the terminal status (offer or rejection)
     * @param appliedAt when the application was submitted
     * @param resolvedAt when the application reached its final status
     * @param daysToResolution number of days from application to resolution
     */
    public record QuickOutcome(
            Long applicationId,
            String companyName,
            String positionTitle,
            ApplicationStatus finalStatus,
            Instant appliedAt,
            Instant resolvedAt,
            Long daysToResolution
    ) {}

    /**
     * Summary counts for dashboard widgets.
     *
     * @param staleCount number of stale applications
     * @param hotCount number of hot applications
     * @param quickWinCount number of quick wins
     * @param quickLossCount number of quick losses
     * @param activeCount total number of active (non-terminal) applications
     */
    public record HealthSummary(
            Integer staleCount,
            Integer hotCount,
            Integer quickWinCount,
            Integer quickLossCount,
            Integer activeCount
    ) {}

    /**
     * Creates an empty ApplicationHealthResponse for users with no applications.
     *
     * @param staleDaysThreshold the staleness threshold that was requested
     * @return an ApplicationHealthResponse with empty data
     */
    public static ApplicationHealthResponse empty(Integer staleDaysThreshold) {
        return new ApplicationHealthResponse(
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                staleDaysThreshold,
                new HealthSummary(0, 0, 0, 0, 0)
        );
    }
}
