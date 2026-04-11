package com.nolcox.jobtracking.application.dto.response;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;

import java.util.List;
import java.util.Set;

/**
 * Response DTO for the status transition matrix analytics endpoint.
 *
 * <p>Contains data suitable for heatmap visualization showing the count
 * of transitions between different application statuses. This helps users
 * understand their typical application flow patterns.</p>
 *
 * <p>The matrix data shows how many times applications moved from one status
 * to another (e.g., APPLIED -> RECRUITER_SCREEN occurred 15 times).</p>
 *
 * @param transitions list of status transitions with their counts
 * @param statuses all unique statuses that appear in the transitions (for axis labels)
 * @param totalTransitions total number of status transitions analyzed
 */
public record TransitionMatrixResponse(
        List<StatusTransition> transitions,
        Set<ApplicationStatus> statuses,
        Long totalTransitions
) {
    /**
     * Represents a single status transition with its occurrence count.
     *
     * <p>Used as the data point for heatmap cells where fromStatus is the row,
     * toStatus is the column, and count is the cell value/color intensity.</p>
     *
     * @param fromStatus the status the application was transitioning from
     * @param toStatus the status the application transitioned to
     * @param count number of times this specific transition occurred
     */
    public record StatusTransition(
            ApplicationStatus fromStatus,
            ApplicationStatus toStatus,
            Long count
    ) {}

    /**
     * Creates an empty TransitionMatrixResponse for users with no status transitions.
     *
     * @return a TransitionMatrixResponse with empty data
     */
    public static TransitionMatrixResponse empty() {
        return new TransitionMatrixResponse(List.of(), Set.of(), 0L);
    }
}
