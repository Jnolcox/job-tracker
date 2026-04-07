package com.nolcox.jobtracking.application.dto.response;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for status configuration endpoint.
 *
 * <p>Provides all application status definitions with their display properties
 * and logical groupings. This allows the frontend to dynamically render
 * status options and organize them by category.</p>
 *
 * @param statuses list of all available status definitions with their display properties
 * @param groups map of group names to the statuses that belong to each group
 */
public record StatusConfigResponse(
        List<StatusInfo> statuses,
        Map<String, List<String>> groups
) {
    /**
     * Information about a single application status.
     *
     * @param key the enum value/key (e.g., "APPLIED", "TECH_SCREEN")
     * @param label human-readable display label (e.g., "Applied", "Technical Screen")
     * @param color hex color code for UI display (e.g., "#4E9AF1")
     * @param group the logical group this status belongs to (e.g., "ACTIVE", "INTERVIEWING")
     */
    public record StatusInfo(
            String key,
            String label,
            String color,
            String group
    ) {}
}
